import { CompanyTypes, createScraper, SCRAPERS } from 'israeli-bank-scrapers-core';
import { AccountToScrapeConfig } from '../configManager/configManager';

export { ScaperScrapingResult } from 'israeli-bank-scrapers-core/lib/scrapers/base-scraper';
export { Transaction } from 'israeli-bank-scrapers-core/lib/transactions';

export const inputVendors = Object.keys(SCRAPERS)
  // Deprecated. see https://github.com/eshaham/israeli-bank-scrapers/blob/07ecd3de0c4aa051f119aa943493f0cda943158c/src/definitions.ts#L26-L29
  .filter((key) => key !== CompanyTypes.hapoalimBeOnline)
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

type EmitProgressEventFunction = (eventCompanyId: string, message: string) => Promise<void>;

export async function scrape({
  companyId, credentials, startDate, showBrowser = false
}: ScrapeParameters, emitProgressEvent: EmitProgressEventFunction, chromePath: string) {
  if (!credentials || (!credentials.username && !credentials.num && !credentials.id) || !credentials.password) {
    throw new Error(`Missing credentials for scraper. CompanyId: ${companyId}`);
  }

  const options = {
    companyId, // mandatory; one of 'hapoalim', 'discount', 'otsarHahayal', 'leumiCard', 'isracard', 'amex'
    startDate, // the date to fetch transactions from (can't be before the minimum allowed time difference for the scraper)
    combineInstallments: false, // if set to true, all installment transactions will be combine into the first one
    showBrowser, // shows the browser while scraping, good for debugging (default false)
    verbose: false, // include more debug info about in the output
    executablePath: chromePath,
    prepareBrowser: async (_browser) => { },
    preparePage: async (_page) => { }
  };
  const scraper = createScraper(options);
  scraper.onProgress((eventCompanyId: string, payload: { type: string }) => {
    emitProgressEvent(companyId, payload.type);
  });
  const scrapeResult = await scraper.scrape(credentials);
  return scrapeResult;
}
