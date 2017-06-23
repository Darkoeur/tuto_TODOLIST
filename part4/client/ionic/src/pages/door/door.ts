import { Component } from '@angular/core';
import { IonicPage, AlertController, LoadingController, NavController, NavParams } from 'ionic-angular';

import { ZetaPushConnection } from 'zetapush-angular';

import { UsersHandler } from '../../providers/users-handler';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-door',
  templateUrl: 'door.html',
  providers: [UsersHandler]
})
export class DoorPage {

    login: string;
    password: string;
    waitingMsg: any;

  constructor(private usersHandler: UsersHandler, private zp: ZetaPushConnection, public alertCtrl: AlertController, public loadingCtrl: LoadingController, public navCtrl: NavController, public navParams: NavParams) {

  }

  notCompleted(): boolean {
      return (!this.login || !this.password);
  }

  submit(): void {

      this.waitingMsg = this.loadingCtrl.create({
          content: 'Communicating with server...'
      });
      this.waitingMsg.present();

      if(!this.notCompleted()){
          this.zp.connect({login: this.login, password: this.password}).then(
              () => {
                  // Success
                  this.waitingMsg.dismiss();
                  this.navCtrl.push(HomePage);
              },
              error => {
                  // Failure, account may not exist yet
                  this.createAccount();
              }
          );
      }
  }

  private createAccount(): void {
      this.zp.connect().then(
          () => {
              // As we're connected anonymously
              // We have the right to execute macros on server
              this.usersHandler.createAccount(this.login, this.password).then(
                  () => {
                      // Account created
                      this.waitingMsg.dismiss();
                      this.submit();
                  },
                  error => {
                      this.waitingMsg.dismiss();
                      this.show(error[0]);
                  }
              );

          },
          error => {
              // Should not happen except if server error
          }
      );
  }

  private show(error): void {

      let msg = 'Le serveur n\'a pas pu créer le compte.';

      switch(error.code) {
          case 'ACCOUNT_EXISTS':
                msg = 'Mauvais mot de passe !';
                break;
      }

      let alertMsg = this.alertCtrl.create({
         title: error.code,
         subTitle: msg,
         buttons: ['OK']
      });

      alertMsg.present();
  }

}
