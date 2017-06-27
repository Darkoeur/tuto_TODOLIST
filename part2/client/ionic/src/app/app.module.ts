import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { ZetaPushClientConfig, ZetaPushModule } from 'zetapush-angular';

import { NotesApiProvider } from '../api/notes-api.service';
import { NotesManagerProvider } from '../providers/notes-manager/notes-manager';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    ZetaPushModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: ZetaPushClientConfig, useValue: {sandboxId: '< YOUR SANDBOX ID >'}},
    NotesApiProvider,
    NotesManagerProvider
  ]
})
export class AppModule {}
