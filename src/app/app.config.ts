import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Backend } from './util/backend';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(withEventReplay(), withNoIncrementalHydration()), provideHttpClient(withInterceptors([Backend.sessionExpirationInterceptor]))]
};