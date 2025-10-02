import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SupervisorRequest, PurchaseRequest, InventoryRequestDetail } from '../../models/inventory-enhanced.model';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-stock-request-form',
  templateUrl: './stock-request-form.component.html',
  styleUrls: [],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class StockRequestFormComponent {
  @Input() selectedRequest: SupervisorRequest | null = null;
  @Input() selectedPurchase: PurchaseRequest | null = null;
  @Input() selectedRequestItems: InventoryRequestDetail[] = [];
  @Input() supervisorName: string | null = null;
  @Input() showCommentsInput: boolean = false;
  @Input() actionComments: string = '';
  @Input() isProcessing: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmApproveRequest = new EventEmitter<void>();
  @Output() confirmRejectRequest = new EventEmitter<void>();
  @Output() actionCommentsChange = new EventEmitter<string>();

  constructor() {}

  // Generate dummy rows to ensure table has 18 rows
  dummyRows(currentLength: number): number[] {
    const totalRows = 18;
    return Array(totalRows - currentLength).fill(0).map((_, i) => i);
  }
}