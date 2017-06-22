import { Injectable } from '@angular/core';
import { UsersApi } from '../api/users-api.service';

@Injectable()
export class UsersHandler {

  constructor(private api: UsersApi) { }

  // No need observable here
  createAccount(loginWanted: string, passwordWanted: string): Promise<any> {
      return this.api.create({login: loginWanted, password: passwordWanted});
  }

}
