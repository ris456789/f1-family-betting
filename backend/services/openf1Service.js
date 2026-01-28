import axios from 'axios';
import { drivers2026, getTeamColor } from '../data/drivers2026.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// Cache for driver headshots
let driverHeadshotsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch driver data including headshots from OpenF1
 */
export async function fetchDriverHeadshots() {
  // Return cached data if still valid
  if (driverHeadshotsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return driverHeadshotsCache;
  }

  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
      params: { session_key: 'latest' }
    });

    const openF1Drivers = response.data;

    // Map OpenF1 data to our driver codes
    const headshotMap = {};
    openF1Drivers.forEach(driver => {
      if (driver.name_acronym) {
        headshotMap[driver.name_acronym] = {
          headshotUrl: driver.headshot_url || null,
          teamColor: driver.team_colour || null,
          countryCode: driver.country_code || null
        };
      }
    });

    driverHeadshotsCache = headshotMap;
    cacheTimestamp = Date.now();

    return headshotMap;
  } catch (error) {
    console.error('Error fetching OpenF1 driver data:', error.message);
    return {};
  }
}

/**
 * Get drivers with headshots for 2026 season
 * Combines our static 2026 data with OpenF1 headshots
 */
export async function getDriversWithHeadshots() {
  const headshots = await fetchDriverHeadshots();

  return drivers2026.map(driver => {
    const openF1Data = headshots[driver.code] || {};

    return {
      ...driver,
      fullName: driver.name,
      headshotUrl: openF1Data.headshotUrl || null,
      teamColor: getTeamColor(driver.teamId),
      // Generate placeholder if no headshot
      placeholder: !openF1Data.headshotUrl ? {
        initials: driver.code,
        backgroundColor: getTeamColor(driver.teamId)
      } : null
    };
  });
}

/**
 * Get a single driver with headshot by code
 */
export async function getDriverWithHeadshot(code) {
  const drivers = await getDriversWithHeadshots();
  return drivers.find(d => d.code === code) || null;
}

export default {
  fetchDriverHeadshots,
  getDriversWithHeadshots,
  getDriverWithHeadshot
};
