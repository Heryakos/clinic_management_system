import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';

@Component({
  selector: 'app-notification-card',
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.css'],
  // standalone: true,
  // imports: [CommonModule, ReactiveFormsModule, MatDialogModule]
})
export class NotificationCardComponent implements OnInit {
  notificationForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: string | null = null;
  employeeID: string | null = null;
  notifications: any[] = [];
  unreadCount: number = 0;
  imagePreview: string | null = null;
  imageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm(): void {
    this.notificationForm = this.fb.group({
      employeeID: [{ value: '', disabled: true }],
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        // Check if the response has c_Employees array and it's not empty
        if (response && response.c_Employees && response.c_Employees.length > 0) {
          const employee = response.c_Employees[0]; // Get the first employee from the c_Employees array
          console.log('Full employee object:', employee);
          this.userId = employee.user_ID ?? null;
          this.employeeID = employee.employee_Id ?? null;
          this.notificationForm.patchValue({ employeeID: this.employeeID });
          this.loadNotifications();
          this.loadUnreadCount();
          console.log('employee_Id', this.employeeID);
        } else {
          console.error('No employee data found');
          this.errorMessage = 'No employee data found. Please try again.';
        }
      },
      error => {
        console.error('Error loading user data:', error);
        this.errorMessage = 'Failed to load employee data. Please try again.';
      }
    );
  }

  loadNotifications(): void {
    if (this.employeeID) {
      this.medicalService.getNotificationsByRecipientUserName(this.employeeID).subscribe(
        (notifications: any[]) => {
          this.notifications = notifications.map(notification => ({
            ...notification,
            imageData: notification.imageData ? `data:image/jpeg;base64,${notification.imageData}` : null
          }));
          // Mark unread notifications as read
          this.notifications
            .filter(n => !n.isRead)
            .forEach(n => this.markAsRead(n.notificationID));
          this.loadUnreadCount();
        },
        error => {
          console.error('Error loading notifications:', error);
          this.errorMessage = 'Failed to load notifications. Please try again.';
        }
      );
    }
  }

  loadUnreadCount(): void {
    if (this.employeeID) {
      this.medicalService.getUnreadNotificationsCount(this.employeeID).subscribe(
        (response: any) => {
          this.unreadCount = response.unreadCount || 0;
        },
        error => {
          console.error('Error loading unread count:', error);
          this.unreadCount = 0;
        }
      );
    }
  }

  markAsRead(notificationId: number): void {
    this.medicalService.markNotificationAsRead(notificationId).subscribe(
      () => {
        const notification = this.notifications.find(n => n.notificationID === notificationId);
        if (notification) {
          notification.isRead = true;
          this.loadUnreadCount();
        }
      },
      error => {
        console.error('Error marking notification as read:', error);
      }
    );
  }

  openImagePreview(imageSrc: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageSrc },
      width: '800px'
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.imageFile);
    } else {
      this.imageFile = null;
      this.imagePreview = null;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.notificationForm.valid && this.userId && this.employeeID) {
      this.isSubmitting = true;
      this.errorMessage = null;
      this.successMessage = null;

      let imageData: string | null = null;
      if (this.imageFile) {
        imageData = await this.readFileAsBase64(this.imageFile);
        imageData = imageData.split(',')[1];
      }

      const notification = {
        userId: this.userId,
        employeeID: this.employeeID,
        message: this.notificationForm.value.message,
        timestamp: new Date(),
        imageData
      };

      this.medicalService.createNotification(notification).subscribe(
        () => {
          this.isSubmitting = false;
          this.successMessage = 'Notification sent successfully!';
          this.resetForm();
          this.loadNotifications();
        },
        error => {
          this.isSubmitting = false;
          this.errorMessage = 'Failed to send notification. Please try again.';
          console.error('Error creating notification:', error);
        }
      );
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  resetForm(): void {
    this.notificationForm.reset({ employeeID: this.employeeID });
    this.errorMessage = null;
    this.successMessage = null;
    this.imagePreview = null;
    this.imageFile = null;
  }
}