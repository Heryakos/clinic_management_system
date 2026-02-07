import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-patient-history',
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.css']
})
export class PatientHistoryComponent implements OnInit {
  cardNumber: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['card']) {
        this.cardNumber = params['card'].trim().toUpperCase();
      }
    });
  }

  loadHistory() {
    if (this.cardNumber.trim()) {
      this.cardNumber = this.cardNumber.trim().toUpperCase();
    }
  }
}