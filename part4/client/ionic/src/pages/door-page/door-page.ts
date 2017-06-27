import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, LoadingController } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { UsersHandlerProvider } from '../../providers/users-handler/users-handler';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
    selector: 'page-door-page',
    templateUrl: 'door-page.html',
    providers: [UsersHandlerProvider]
})
export class DoorPage {

    login: string;
    password: string;
    waitingMsg: any;

    constructor(private usersHandler: UsersHandlerProvider,
                private zp: ZetaPushConnection,
                public loadingCtrl: LoadingController,
                public alertCtrl: AlertController,
                public navCtrl: NavController) { }

    notCompleted(): boolean {
        return (!this.login || !this.password);
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
