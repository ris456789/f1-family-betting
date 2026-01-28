// Re-export from f1DataService for backwards compatibility
// The original Ergast API (ergast.com) is no longer available
// This now uses hardcoded 2026 calendar + OpenF1 API for results

export {
  getRaceSchedule,
  getUpcomingRaces,
  getNextRace,
  getDrivers,
  getDriversWithTeams,
  getRaceResults,
  getQualifyingResults
} from './f1DataService.js';

import f1DataService from './f1DataService.js';
export default f1DataService;
