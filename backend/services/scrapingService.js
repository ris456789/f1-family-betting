import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape race incident data from Wikipedia
 * Returns safety car and red flag information
 */
export async function scrapeRaceIncidents(year, raceName) {
  try {
    // Format race name for Wikipedia URL
    const formattedName = raceName.replace(/ /g, '_');
    const url = `https://en.wikipedia.org/wiki/${year}_${formattedName}`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'F1FamilyBettingApp/1.0' }
    });

    const $ = cheerio.load(response.data);
    const pageText = $('body').text().toLowerCase();

    // Check for safety car mentions
    const safetyCar = pageText.includes('safety car') ||
                      pageText.includes('virtual safety car') ||
                      pageText.includes('vsc');

    // Check for red flag mentions
    const redFlag = pageText.includes('red flag') ||
                    pageText.includes('red-flagged') ||
                    pageText.includes('stopped');

    return {
      safetyCar,
      redFlag,
      source: 'wikipedia',
      scraped: true
    };
  } catch (error) {
    console.error('Error scraping Wikipedia:', error.message);
    return {
      safetyCar: null,
      redFlag: null,
      source: 'wikipedia',
      scraped: false,
      error: error.message
    };
  }
}

/**
 * Scrape Driver of the Day from F1.com
 */
export async function scrapeDriverOfTheDay(year, round) {
  try {
    // F1.com DOTD results page structure
    const url = `https://www.formula1.com/en/results.html/${year}/races/${round}/driver-of-the-day.html`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Try to find DOTD winner - F1.com structure varies
    let dotdDriver = null;

    // Look for the winner in various possible elements
    $('.driver-name, .f1-driver-name, [class*="driver"]').each((i, el) => {
      if (i === 0) { // First driver is usually the winner
        dotdDriver = $(el).text().trim();
      }
    });

    return {
      driverOfTheDay: dotdDriver,
      source: 'f1.com',
      scraped: !!dotdDriver
    };
  } catch (error) {
    console.error('Error scraping DOTD:', error.message);
    return {
      driverOfTheDay: null,
      source: 'f1.com',
      scraped: false,
      error: error.message
    };
  }
}

/**
 * Scrape winning margin from race results
 * This is usually available in the Ergast API, but we can enhance it
 */
export async function scrapeWinningMargin(year, raceName) {
  try {
    const formattedName = raceName.replace(/ /g, '_');
    const url = `https://en.wikipedia.org/wiki/${year}_${formattedName}`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'F1FamilyBettingApp/1.0' }
    });

    const $ = cheerio.load(response.data);

    // Look for time gap in race classification table
    let winningMargin = null;

    $('table').each((i, table) => {
      const tableText = $(table).text();
      if (tableText.includes('Classification') || tableText.includes('Result')) {
        // Find the second row (P2) and extract the gap
        const rows = $(table).find('tr');
        if (rows.length > 2) {
          const secondRow = $(rows[2]).text();
          const gapMatch = secondRow.match(/\+(\d+\.\d+)/);
          if (gapMatch) {
            winningMargin = parseFloat(gapMatch[1]);
          }
        }
      }
    });

    return {
      winningMargin,
      source: 'wikipedia',
      scraped: !!winningMargin
    };
  } catch (error) {
    console.error('Error scraping winning margin:', error.message);
    return {
      winningMargin: null,
      source: 'wikipedia',
      scraped: false,
      error: error.message
    };
  }
}

/**
 * Get all supplementary race data
 * Combines incidents, DOTD, and winning margin
 */
export async function getAllSupplementaryData(year, round, raceName) {
  const [incidents, dotd, margin] = await Promise.all([
    scrapeRaceIncidents(year, raceName),
    scrapeDriverOfTheDay(year, round),
    scrapeWinningMargin(year, raceName)
  ]);

  return {
    safetyCar: incidents.safetyCar,
    redFlag: incidents.redFlag,
    driverOfTheDay: dotd.driverOfTheDay,
    winningMargin: margin.winningMargin,
    scrapingStatus: {
      incidents: incidents.scraped,
      dotd: dotd.scraped,
      margin: margin.scraped
    }
  };
}

export default {
  scrapeRaceIncidents,
  scrapeDriverOfTheDay,
  scrapeWinningMargin,
  getAllSupplementaryData
};
