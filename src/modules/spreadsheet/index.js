// copied from https://github.com/getstation/electron-google-oauth2/blob/7082c80b8f98bad26a7cd61c671cf58b99834381/src/index.ts
// inspired by https://github.com/parro-it/electron-google-oauth
// eslint-disable-next-line import/no-extraneous-dependencies
import { shell, BrowserWindow, remote } from 'electron';
import { EventEmitter } from 'events';
import { google } from 'googleapis';
import { stringify } from 'querystring';
import * as url from 'url';
import LoopbackRedirectServer from './LoopbackRedirectServer';

const BW = process.type === 'renderer' ? remote.BrowserWindow : BrowserWindow;
/**
 * Tokens updated event
 *
 * @event ElectronGoogleOAuth2#tokens
 * @type {Credentials}
 */

export const defaultElectronGoogleOAuth2Options = {
  successRedirectURL: 'https://github.com/baruchiro/israeli-bank-scrapers-desktop',
  // can't be randomized
  loopbackInterfaceRedirectionPort: 42813,
  refocusAfterSuccess: true,
};

/**
 * Handle Google Auth processes through Electron.
 * This class automatically renews expired tokens.
 * @fires ElectronGoogleOAuth2#tokens
 */
export default class ElectronGoogleOAuth2 extends EventEmitter {
  /**
   * Create a new instance of ElectronGoogleOAuth2
   * @param {string} clientId - Google Client ID
   * @param {string} clientSecret - Google Client Secret
   * @param {string[]} scopes - Google scopes. 'profile' and 'email' will always be present
   * @param {string} successRedirectURL
   */
  constructor(
    clientId,
    clientSecret,
    scopes,
    options = defaultElectronGoogleOAuth2Options,
  ) {
    super();
    // Force fetching id_token if not provided
    if (!scopes.includes('profile')) scopes.push('profile');
    if (!scopes.includes('email')) scopes.push('email');
    this.scopes = scopes;
    this.options = { ...defaultElectronGoogleOAuth2Options, ...options };
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `http://127.0.0.1:${this.options.loopbackInterfaceRedirectionPort}/callback`,
    );
    this.oauth2Client.on('tokens', (tokens) => {
      this.emit('tokens', tokens);
    });
  }

  /**
   * Returns authUrl generated by googleapis
   * @param {boolean} forceAddSession
   * @returns {string}
   */
  generateAuthUrl(forceAddSession = false) {
    let url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
      scope: this.scopes,
      redirect_uri: `http://127.0.0.1:${this.options.loopbackInterfaceRedirectionPort}/callback`,
    });

    if (forceAddSession) {
      const qs = stringify({ continue: url });
      url = `https://accounts.google.com/AddSession?${qs}`;
    }

    return url;
  }

  /**
   * Get authorization code for underlying authUrl
   * @param {boolean} forceAddSession
   * @returns {Promise<string>}
   */
  getAuthorizationCode(forceAddSession = false) {
    const url = this.generateAuthUrl(forceAddSession);
    return this.openAuthWindowAndGetAuthorizationCode(url);
  }

  /**
   * Get authorization code for given url
   * @param {string} urlParam
   * @returns {Promise<string>}
   */
  openAuthWindowAndGetAuthorizationCode(urlParam) {
    return this.openAuthPageAndGetAuthorizationCode(urlParam);
  }

  async openAuthPageAndGetAuthorizationCode(urlParam) {
    if (this.server) {
      // if a server is already running, we close it so that we free the port
      // and restart the process
      await this.server.close();
      this.server = null;
    }
    this.server = new LoopbackRedirectServer({
      port: this.options.loopbackInterfaceRedirectionPort,
      callbackPath: '/callback',
      successRedirectURL: this.options.successRedirectURL,
    });

    shell.openExternal(urlParam);

    const reachedCallbackURL = await this.server.waitForRedirection();

    // waitForRedirection will close the server
    this.server = null;

    const parsed = url.parse(reachedCallbackURL, true);
    if (parsed.query.error) {
      throw new Error(parsed.query.error_description);
    } else if (!parsed.query.code) {
      throw new Error('Unknown');
    }

    if (this.options.refocusAfterSuccess) {
      // refocus on the window
      BW.getAllWindows().filter((w) => w.isVisible()).forEach((w) => w.show());
    }

    return parsed.query.code;
  }

  /**
   * Get Google tokens for given scopes
   * @param {boolean} forceAddSession
   * @returns {Promise<Credentials>}
   */
  async openAuthWindowAndGetTokens(forceAddSession = false) {
    const authorizationCode = await this.getAuthorizationCode(forceAddSession);
    const response = await this.oauth2Client.getToken(authorizationCode);
    this.oauth2Client.setCredentials(response.tokens);
    return response.tokens;
  }

  setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }
}
