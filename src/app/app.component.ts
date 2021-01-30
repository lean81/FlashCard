import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Card} from './Card';
import {GroupByUtil} from './utilities/groupByUtil';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {

  constructor(private router: Router, private http: HttpClient) {
  }


  title = 'FlashCard2';
  public curCard: Card = null;
  public showInformation = false;
  public addNewCard = false;
  public editingCard = false;
  public showImport = false;
  public cardToDelete: Card = null;
  public allCards: Card[] = [];
  public remainingCardsInSet: Card[] = [];
  public currentLevel = 0;

  @Input()
  public name: string;

  @Input()
  public pinyin: string;

  @Input()
  public description: string;

  @Input()
  public importText: string;

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

  async ngOnInit(): Promise<void> {
    this.allCards = JSON.parse(localStorage.getItem('allFlashCards')) ?? [];
    /*const chineseCards = await ((this.http.get('assets/chinese.json')).toPromise()) as Card[];
    for (const c of chineseCards) {
      if (this.allCards.findIndex(ce => c.name === ce.name) < 0) {
        this.allCards.push(c);
      }
    }*/

    this.showNextCard();
  }

  public createCard(): void {
    if (this.allCards.filter(c => c.name === this.name).length > 0) {
      alert('The symbol ' + this.name + ' already exists.');
      return;
    }
    this.allCards.push({
      numCorrect: 0,
      numWrong: 0,
      id: this.allCards.length + 1,
      name: this.name,
      pinyin: this.pinyin,
      description: this.description,
      level: 1
    });
    this.name = '';
    this.pinyin = '';
    this.description = '';
    this.remainingCardsInSet = [];
    this.showNextCard();
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
    if (!this.showImport){
      this.showImport = true;
      return;
    }

    if (!this.importText) {
      this.showImport = false;
      return;
    }

    if (this.importText.charAt(0) !== '[') {
      this.importText = '';
    }

    this.allCards = JSON.parse(this.importText) ?? [];
    this.importText = '';
    this.showImport = false;
    this.remainingCardsInSet = [];
    this.showNextCard();
    }

  public wrongClicked(): void{
    this.curCard.numWrong++;
    this.curCard.level = 1;
    this.showNextCard();
  }

  public rightClicked(): void {
    if (this.curCard.level === this.currentLevel){
      this.curCard.numCorrect++;
      this.curCard.level++;
    }
    this.showNextCard();
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  public getGroupSize(level: number): number {
    return Math.round(3 * Math.pow(1.5, level - 1));
  }

  public getLimitedGroupSize(level: number): number {
    const size = this.getGroupSize(level);
    return Math.min(size, 12);
  }

  private showNextCard(): void {
    this.editingCard = false;
    this.allCards = this.allCards ?? [];
    let idCount = 1;
    for (const c of this.allCards) {
      c.level = c.level ?? 1;
      c.id = idCount++;

      // Add same number of new lines for all descriptions
      for (let j = 0; j < 3 - c.description.split('\n').length; j++){
        c.description += '\n';
      }
    }
    this.saveAllLocalAndClearCardToDelete();
    this.showInformation = false;


    let smallestGroup: Card[] = null;
    let smallestLevel = 0;
    if (this.remainingCardsInSet.length <= 1) {
      this.addNewCard = true;
      const grouped = GroupByUtil.groupBy(this.allCards, (c) => c.level).sort((a, b) => a.key - b.key);
      this.remainingCardsInSet = [];
      const prevCard = this.curCard;

      for (const obj of grouped) {
        const level = obj.key;
        const group2 = obj.values as Card[];
        const groupSize = this.getGroupSize(level);


        if (group2.length < groupSize) {
          for (const higherGroup of grouped.filter(g => g.key > level)) {
            const higherGroupRandomized = higherGroup.values.slice();
            this.shuffleArray(higherGroupRandomized);
            const needed = higherGroupRandomized.slice(0, groupSize - group2.length);
            group2.push(...needed);
          }
        }else {
          this.addNewCard = false;
        }

        // console.log(level + ' ' + group2.length + ' gs: ' + groupSize);
        if (group2.length >= groupSize) {
          this.currentLevel = level;
          this.remainingCardsInSet = group2.sort((a, b) => a.id - b.id).slice(0, groupSize);
          while (true) {
            this.shuffleArray(this.remainingCardsInSet);
            if (this.remainingCardsInSet[0] !== prevCard) {
                this.remainingCardsInSet = this.remainingCardsInSet.slice(0, this.getLimitedGroupSize(level));
                if (!smallestGroup){
                  smallestGroup = this.remainingCardsInSet;
                  smallestLevel = level;
                }
                break;
            }
          }
        }
      }

      if (this.addNewCard && smallestGroup) {
        this.remainingCardsInSet = smallestGroup;
        this.currentLevel = smallestLevel;
      }

      if (this.remainingCardsInSet.length === 0) {
        this.curCard = null;
        this.currentLevel = 0;
        this.name = '';
        this.description = '';
        this.pinyin = '';
      } else {
        this.curCard = this.remainingCardsInSet[0];
      }
    } else {
      this.remainingCardsInSet = this.remainingCardsInSet.slice(1);
      this.curCard = this.remainingCardsInSet[0];
    }
  }

  public cardClicked(): void{
    this.showInformation = true;
  }

  public editCard(): void {
    if (!this.curCard) {
      return;
    }

    if (this.editingCard) {
      this.curCard.name = this.name;
      this.curCard.description = this.description;
      this.curCard.pinyin = this.pinyin;
      this.editingCard = false;
    }else {
      this.name = this.curCard.name;
      this.description = this.curCard.description;
      this.pinyin = this.curCard.pinyin;
      this.editingCard = true;
    }
  }
}
