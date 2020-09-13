import { createScraper, SCRAPERS } from '@brafdlog/israeli-bank-scrapers-core';
import getChrome from '../../modules/downloadChromium';
import { AccountToScrapeConfig } from '../configManager/configManager';

export { ScaperScrapingResult } from '@brafdlog/israeli-bank-scrapers-core/lib/scrapers/base-scraper';
export { Transaction } from '@brafdlog/israeli-bank-scrapers-core/lib/transactions';

export const inputVendors = Object.keys(SCRAPERS)
  .map((key) => ({
    key,
    ...SCRAPERS[key],
  }));

interface ScrapeParameters {
  companyId: AccountToScrapeConfig['key'];
  credentials: AccountToScrapeConfig['loginFields'];
  startDate: Date;
  showBrowser?: boolean
}

export async function scrape({
  companyId, credentials, startDate, showBrowser = false
}: ScrapeParameters, emitProgressEvent: (message: string) => Promise<void>) {
  if (!credentials || (!credentials.username && !credentials.num && !credentials.id) || !credentials.password) {
    throw new Error(`Missing credentials for scraper. CompanyId: ${companyId}`);
  }

  const chromePath = await getChrome(undefined, console.log);

  const options = {
    companyId, // mandatory; one of 'hapoalim', 'discount', 'otsarHahayal', 'leumiCard', 'isracard', 'amex'
    startDate, // the date to fetch transactions from (can't be before the minimum allowed time difference for the scraper)
    combineInstallments: false, // if set to true, all installment transactions will be combine into the first one
    showBrowser, // shows the browser while scraping, good for debugging (default false)
    verbose: false, // include more debug info about in the output
    executablePath: chromePath
  };
  const scraper = createScraper(options);
  scraper.onProgress(emitProgressEvent);
  const scrapeResult = await scraper.scrape(credentials);
  return scrapeResult;
}
