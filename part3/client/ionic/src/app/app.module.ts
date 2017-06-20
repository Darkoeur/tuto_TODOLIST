import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { DoorPage } from '../pages/door/door';

import { ZetaPushClientConfig, ZetaPushModule } from 'zetapush-angular';
import { NotesManager } from '../providers/notes-manager';
import { NotesApiProvider } from '../api/notes-api.service';
import { UsersApiProvider } from '../api/users-api.service';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    DoorPage
  ],
  imports: [
    BrowserModule,
    ZetaPushModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    DoorPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    NotesApiProvider,
    UsersApiProvider,
    NotesManager,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    { provide: ZetaPushClientConfig, useValue: {sandboxId: '7gN79Qmz'} }
  ]
})
export class AppModule {}
