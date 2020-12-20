import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Card} from './Card';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {

  constructor(private router: Router) {
  }


  title = 'FlashCard2';
  public curCard: Card = null;
  public cardToDelete: Card = null;
  public allCards: Card[] = [];
  public remainingCardsInSet: Card[] = [];

  @Input()
  public name: string;

  @Input()
  public pinyin: string;

  @Input()
  public description: string;

  private static copyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
  }

  ngOnInit(): void {
    this.allCards = JSON.parse(localStorage.getItem('allFlashCards')) ?? [];
    this.showNextCard();
  }

  public createCard(): void {
    this.allCards.push({
      numCorrect: 0,
      numWrong: 0,
      ID: this.allCards.length + 1,
      Name: this.name,
      Pinyin: this.pinyin,
      Description: this.description
    });
    this.curCard = this.allCards[0];
    this.saveAllLocalAndClearCardToDelete();
  }

  private saveAllLocalAndClearCardToDelete(): void {
    const d = JSON.stringify(this.allCards);
    // Store
    localStorage.setItem('allFlashCards', d);
    this.cardToDelete = null;
  }

  public deleteCard(): void {
    if (this.cardToDelete !== this.curCard) {
      this.cardToDelete = this.curCard;
      return;
    }
    const index = this.allCards.indexOf(this.curCard, 0);
    if (index > -1) {
      this.allCards.splice(index, 1);
    }
    this.curCard = this.allCards[0];
    this.saveAllLocalAndClearCardToDelete();
  }

  public copyToClipBoard(): void {
    const d = JSON.stringify(this.allCards);
    AppComponent.copyTextToClipboard(d);
    alert('Copied');
  }

  public import(): void {
    if (!this.description) {
      return;
    }
    if (this.description.charAt(0) !== '[') {
      this.description = '';
    }

    this.allCards = JSON.parse(this.description) ?? [];
    this.description = '';
    this.curCard = this.allCards[0];
  }

  public wrongClicked(): void{
    this.curCard.numWrong++;
    this.showNextCard();
  }

  public rightClicked(): void{
    this.curCard.numCorrect++;
    this.showNextCard();
  }
  private showNextCard(): void{
    if (this.remainingCardsInSet.length <= 1) {
      const levelAndCards = this.allCards
        .map(c =>  ({card: c, level: (c.numCorrect - c.numCorrect)}))
        .sort((n1, n2) => n1.level - n2.level);
      const grouped = levelAndCards.reduce((h, obj) => Object.assign(h, { [obj.level]:( h[obj.level] || [] ).concat(obj) }), {});
      this.remainingCardsInSet = grouped[0].map(c => c.card);
      this.curCard = this.remainingCardsInSet[0];
    } else {
      this.remainingCardsInSet = this.remainingCardsInSet.slice(1);
      this.curCard = this.remainingCardsInSet[0];
    }
  }
}
