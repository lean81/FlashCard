import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Card} from './Card';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {
  title = 'FlashCard2';
  public curCard: Card = null;
  public allCards: Card[] = [];


  @Input()
  public name: string;

  @Input()
  public description: string;

  constructor(private router: Router) { }

  ngOnInit(): void {



  }

  public createCard(): void {
    this.allCards.push({
      numCorrect: 0,
      numWrong: 0,
      ID: this.allCards.length + 1,
      Name: this.name,
      Description: this.description
    });
    this.curCard = this.allCards[0];
  }
}
