import axios from 'axios';
import { races2026, formatRace, getRaceByRound } from '../data/races2026.js';
import { drivers2026 } from '../data/drivers2026.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

/**
 * Get the race schedule for a given year
 * Uses hardcoded 2026 calendar
 */
export async function getRaceSchedule(year = 2026) {
  // For 2026, return hardcoded calendar
  if (parseInt(year) === 2026) {
    return races2026.map(formatRace);
  }

  // For other years, we could try OpenF1 but it may not have future schedules
  // Return empty for now
  console.warn(`No schedule available for year ${year}`);
  return [];
}

/**
 * Get upcoming races (races that haven't happened yet)
 */
export async function getUpcomingRaces() {
  const schedule = await getRaceSchedule(2026);
  const now = new Date();

  return schedule.filter(race => {
    const raceDate = new Date(`${race.date}T${race.time}`);
    return raceDate > now;
  });
}

/**
 * Get the next upcoming race
 */
export async function getNextRace() {
  const upcoming = await getUpcomingRaces();
  return upcoming[0] || null;
}

/**
 * Get drivers for a given year
 * Uses hardcoded 2026 drivers
 */
export async function getDrivers(year = 2026) {
  if (parseInt(year) === 2026) {
    return drivers2026.map(driver => ({
      driverId: driver.driverId,
      code: driver.code,
      number: driver.number,
      firstName: driver.firstName || driver.name.split(' ')[0],
      lastName: driver.lastName || driver.name.split(' ').slice(1).join(' '),
      fullName: driver.name,
      nationality: '',
      team: driver.team,
      teamId: driver.teamId
    }));
  }

  return [];
}

/**
 * Get drivers with their current constructor (team)
 */
export async function getDriversWithTeams(year = 2026) {
  return getDrivers(year);
}

/**
 * Fetch race results from OpenF1 API
 * Note: OpenF1 only has data for races that have actually happened
 */
export async function getRaceResults(year, round) {
  try {
    // First, get the session key for this race
    const sessionsResponse = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
      params: {
        year: year,
        session_name: 'Race'
      }
    });

    const sessions = sessionsResponse.data;
    if (!sessions || sessions.length === 0) {
      throw new Error('No race sessions found for this year');
    }

    // Find the session for this round
    // OpenF1 doesn't use round numbers, so we need to match by date or meeting
    const race = getRaceByRound(round);
    if (!race) {
      throw new Error(`Race round ${round} not found`);
    }

    // Try to find the matching session
    const raceSession = sessions.find(s => {
      const sessionDate = new Date(s.date_start).toISOString().split('T')[0];
      return sessionDate === race.date;
    }) || sessions[parseInt(round) - 1]; // Fallback to index

    if (!raceSession) {
      throw new Error('Could not find matching race session');
    }

    // Get position data for this session
    const positionsResponse = await axios.get(`${OPENF1_BASE_URL}/position`, {
      params: {
        session_key: raceSession.session_key
      }
    });

    // Get the final positions (last position entry for each driver)
    const positions = positionsResponse.data;
    const finalPositions = {};

    positions.forEach(pos => {
      if (!finalPositions[pos.driver_number] ||
          new Date(pos.date) > new Date(finalPositions[pos.driver_number].date)) {
        finalPositions[pos.driver_number] = pos;
      }
    });

    // Get driver info for this session
    const driversResponse = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
      params: {
        session_key: raceSession.session_key
      }
    });

    const sessionDrivers = driversResponse.data;

    // Build results array
    const results = Object.values(finalPositions)
      .sort((a, b) => a.position - b.position)
      .map(pos => {
        const driver = sessionDrivers.find(d => d.driver_number === pos.driver_number);
        const driver2026 = drivers2026.find(d =>
          d.code === driver?.name_acronym ||
          d.number === pos.driver_number
        );

        return {
          position: pos.position,
          driverId: driver2026?.driverId || driver?.name_acronym?.toLowerCase() || `driver_${pos.driver_number}`,
          driverCode: driver?.name_acronym || driver2026?.code || '',
          driverName: driver?.full_name || driver2026?.name || `Driver ${pos.driver_number}`,
          team: driver?.team_name || driver2026?.team || 'Unknown',
          grid: 0, // Would need qualifying data
          laps: 0,
          status: 'Finished',
          time: null,
          fastestLap: false,
          fastestLapTime: null,
          points: 0
        };
      });

    // Try to get fastest lap data
    try {
      const lapsResponse = await axios.get(`${OPENF1_BASE_URL}/laps`, {
        params: {
          session_key: raceSession.session_key,
          is_pit_out_lap: false
        }
      });

      // Find fastest lap
      const laps = lapsResponse.data.filter(l => l.lap_duration);
      if (laps.length > 0) {
        const fastestLap = laps.reduce((min, lap) =>
          lap.lap_duration < min.lap_duration ? lap : min
        );

        const fastestDriver = results.find(r => {
          const driver = sessionDrivers.find(d => d.driver_number === fastestLap.driver_number);
          return r.driverCode === driver?.name_acronym;
        });

        if (fastestDriver) {
          fastestDriver.fastestLap = true;
          fastestDriver.fastestLapTime = fastestLap.lap_duration;
        }
      }
    } catch (e) {
      console.warn('Could not fetch fastest lap data:', e.message);
    }

    return results;
  } catch (error) {
    console.error('Error fetching race results from OpenF1:', error.message);
    throw error;
  }
}

/**
 * Get qualifying results from OpenF1 API
 */
export async function getQualifyingResults(year, round) {
  try {
    const sessionsResponse = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
      params: {
        year: year,
        session_name: 'Qualifying'
      }
    });

    const sessions = sessionsResponse.data;
    const race = getRaceByRound(round);

    if (!race || !sessions || sessions.length === 0) {
      return [];
    }

    // Find matching qualifying session
    const qualifyingSession = sessions.find(s => {
      const sessionDate = new Date(s.date_start).toISOString().split('T')[0];
      const qualDate = new Date(race.date);
      qualDate.setDate(qualDate.getDate() - 1);
      return sessionDate === qualDate.toISOString().split('T')[0];
    }) || sessions[parseInt(round) - 1];

    if (!qualifyingSession) {
      return [];
    }

    // Get position data
    const positionsResponse = await axios.get(`${OPENF1_BASE_URL}/position`, {
      params: {
        session_key: qualifyingSession.session_key
      }
    });

    const driversResponse = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
      params: {
        session_key: qualifyingSession.session_key
      }
    });

    const positions = positionsResponse.data;
    const sessionDrivers = driversResponse.data;

    // Get final positions
    const finalPositions = {};
    positions.forEach(pos => {
      if (!finalPositions[pos.driver_number] ||
          new Date(pos.date) > new Date(finalPositions[pos.driver_number].date)) {
        finalPositions[pos.driver_number] = pos;
      }
    });

    return Object.values(finalPositions)
      .sort((a, b) => a.position - b.position)
      .map(pos => {
        const driver = sessionDrivers.find(d => d.driver_number === pos.driver_number);
        const driver2026 = drivers2026.find(d =>
          d.code === driver?.name_acronym ||
          d.number === pos.driver_number
        );

        return {
          position: pos.position,
          driverId: driver2026?.driverId || driver?.name_acronym?.toLowerCase(),
          driverCode: driver?.name_acronym || driver2026?.code || '',
          driverName: driver?.full_name || driver2026?.name || '',
          team: driver?.team_name || driver2026?.team || '',
          q1: null,
          q2: null,
          q3: null
        };
      });
  } catch (error) {
    console.error('Error fetching qualifying results:', error.message);
    return [];
  }
}

/**
 * Fetch official race results from Jolpi.ca (Ergast community mirror)
 * Returns full classification with proper DNF status for each driver.
 * Falls back to null if data isn't available yet (race too recent).
 */
export async function getOfficialResults(year, round) {
  try {
    const url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`;
    const response = await axios.get(url, { timeout: 10000 });
    const races = response.data?.MRData?.RaceTable?.Races;
    if (!races || races.length === 0) return null;

    const race = races[0];
    const results = race.Results || [];
    if (results.length === 0) return null;

    return results.map(r => {
      // Map Jolpi driverId to our 2026 driverId
      const jolpiId = r.Driver?.driverId || '';
      const driver2026 = drivers2026.find(d =>
        d.driverId === jolpiId ||
        d.code === r.Driver?.code ||
        d.name?.toLowerCase().includes((r.Driver?.familyName || '').toLowerCase())
      );

      return {
        position: parseInt(r.position) || 99,
        driverId: driver2026?.driverId || jolpiId,
        driverCode: r.Driver?.code || driver2026?.code || '',
        driverName: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim(),
        team: r.Constructor?.name || driver2026?.team || 'Unknown',
        grid: parseInt(r.grid) || 0,
        laps: parseInt(r.laps) || 0,
        status: r.status || 'Finished',
        time: r.Time?.time || r.status || null,
        fastestLap: r.FastestLap?.rank === '1',
        fastestLapTime: r.FastestLap?.Time?.time || null,
        points: parseFloat(r.points) || 0
      };
    });
  } catch (error) {
    console.warn('[Jolpi] Could not fetch official results:', error.message);
    return null;
  }
}

export default {
  getRaceSchedule,
  getUpcomingRaces,
  getNextRace,
  getDrivers,
  getDriversWithTeams,
  getRaceResults,
  getQualifyingResults,
  getOfficialResults
};
