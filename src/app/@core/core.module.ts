import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NbAuthModule,
  NbPasswordAuthStrategy,
  NbAuthSimpleToken,
} from '@nebular/auth';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { environment } from '../../environments/environment';

export const NB_CORE_PROVIDERS = [
  ...NbAuthModule.forRoot({
    strategies: [
      NbPasswordAuthStrategy.setup({
        name: 'email',
        baseEndpoint: environment.api,
        refreshToken: false,
        requestPass: false,
        resetPass: false,
        register: false,
        login: {
          endpoint: 'auth/login',
          method: 'post',
        },
        token: {
          class: NbAuthSimpleToken,
          key: 'token',
        },
        logout: {
          endpoint: 'auth/logout',
          method: 'post',
        },
      }),
    ],
    forms: {
      login: {
        redirectDelay: 0,
        rememberMe: false,
      },
    },
  }).providers,
];

@NgModule({
  imports: [CommonModule],
  exports: [NbAuthModule],
  declarations: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [...NB_CORE_PROVIDERS],
    };
  }
}
