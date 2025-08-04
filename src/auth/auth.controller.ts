import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';

/**
 * Controller responsible for authentication-related endpoints
 * Handles Shopify OAuth flow
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Initiate the Shopify OAuth flow
   * @param shop The shop URL to authorize
   * @param res Express response object for redirection
   */
  @Get()
  initiateAuth(@Query('shop') shop: string, @Res() res: Response): void {
    if (!shop) {
      throw new BadRequestException('Missing shop parameter');
    }

    const authUrl = this.authService.generateAuthUrl(shop);
    res.redirect(authUrl);
  }

  /**
   * Handle the OAuth callback from Shopify
   * @param shop The shop URL
   * @param code The temporary code from Shopify
   * @param hmac HMAC signature for verification
   * @param timestamp Request timestamp
   * @param state Optional state parameter
   * @param host Shopify host parameter
   * @param res Express response object for redirection
   */
  @Get('callback')
  async handleCallback(
    @Query('shop') shop: string,
    @Query('code') code: string,
    @Query('hmac') hmac: string,
    @Query('timestamp') timestamp: string,
    @Query('state') state: string,
    @Query('host') host: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!shop || !code) {
      throw new BadRequestException('Missing required parameters');
    }

    this.logger.log(`Received OAuth callback for shop: ${shop}`);

    try {
      // Verify the HMAC signature
      const query = { shop, code, timestamp, state, host };
      const isValid = this.authService.verifyHmac(query, hmac);

      if (!isValid) {
        this.logger.error(`Invalid HMAC signature for shop: ${shop}`);
        throw new BadRequestException('Invalid HMAC signature');
      }

      // Exchange the temporary code for a permanent access token
      const { accessToken, sessionId } =
        await this.authService.exchangeCodeForToken(shop, code);

      // Get the API key for the app
      const apiKey = this.configService.get<string>('SHOPIFY_API_KEY');
      const hostParam = encodeURIComponent(host || '');

      // Construct the redirect URL to the embedded app
      // This format ensures the app is loaded within the Shopify admin
      const redirectUrl = `https://${shop}/admin/apps/${apiKey}?shop=${shop}&host=${hostParam}&session=${sessionId}`;

      this.logger.log(`Redirecting to: ${redirectUrl}`);
      res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      this.logger.error(`OAuth error: ${error.message}`);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Authentication failed: ${error.message}`);
    }
  }
}
