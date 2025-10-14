import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.css'],
  // standalone: true,
  // imports: [CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule]
})
export class NotificationDialogComponent implements OnInit {
  notificationForm!: FormGroup;
  isSubmitting = false;
  imagePreview: string | null = null;
  imageFile: File | null = null;
  userId: string | null = null;
  employeeID: string | null = null;
  rooms: any[] = [];
  uniqueRoomTypes: string[] = [];
  availableDoctors: any[] = [];
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  paginatedNotifications: any[] = [];
  unreadCount: number = 0;
  notificationFilter: string = 'all'; // 'all', 'read', 'unread'
  priorityFilter: string = 'all'; // 'all', 'normal', 'urgent'
  dateRange: { start: string | null; end: string | null } = { start: null, end: null };
  searchQuery: string = '';
  pageSize: number = 10; // Increased for "Load More"
  currentBatch: number = 1; // Tracks the number of batches loaded
  showArchived: boolean = false; // Toggle for archived notifications
  activeTab: 'send' | 'view' = 'view'; // Default to 'view'

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { employeeID: string | null, selectedDoctorUserName: string | null, defaultTab?: 'send' | 'view' }
  ) {
    this.activeTab = data.defaultTab || 'view';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.loadRooms();
    this.loadNotifications();
  }

  initializeForm(): void {
    this.notificationForm = this.fb.group({
      employeeID: [{ value: '', disabled: true }],
      roomType: ['', Validators.required],
      doctorUserName: ['', Validators.required],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      priority: ['Normal', Validators.required] // Added priority field
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        if (response && response.c_Employees && response.c_Employees.length > 0) {
          const employee = response.c_Employees[0];
          this.userId = employee.user_ID ?? null;
          this.employeeID = this.data.employeeID ?? employee.employee_Id ?? null;
          this.notificationForm.patchValue({ employeeID: this.employeeID });
        } else {
          console.error('No employee data found');
          this.dialogRef.close({ error: 'No employee data found. Please try again.' });
        }
      },
      error => {
        console.error('Error loading user data:', error);
        this.dialogRef.close({ error: 'Failed to load employee data.' });
      }
    );
  }

  loadRooms(): void {
    this.medicalService.getRooms().subscribe(
      (rooms: any[]) => {
        this.rooms = rooms.map(room => ({
          roomID: room.RoomID,
          userID: room.UserID,
          userName: room.UserName,
          fName: room.FName,
          mName: room.MName,
          roomType: room.RoomType,
          roleName: room.RoleName,
          roomNumber: room.RoomNumber,
          isActive: room.IsActive,
          department: room.Department,
          roomName: room.RoomName,
          createdDate: room.CreatedDate
        }));
        this.uniqueRoomTypes = [...new Set(this.rooms.map(room => room.roomType))].sort((a, b) => a.localeCompare(b));
      },
      error => {
        console.error('Error loading rooms:', error);
        this.dialogRef.close({ error: 'Failed to load rooms.' });
      }
    );
  }

  loadNotifications(): void {
    const targetId = this.data.selectedDoctorUserName || this.data.employeeID;
    if (targetId) {
      // Default to fetching non-archived notifications (less than 1 year old)
      this.medicalService.getNotificationsByRecipientUserName(targetId, this.showArchived).subscribe(
        (notifications: any[]) => {
          this.notifications = notifications.map(notification => ({
            ...notification,
            imageData: notification.imageData ? `data:image/jpeg;base64,${notification.imageData}` : null
          }));
          this.updateFilteredNotifications();
          this.loadUnreadCount();
        },
        error => {
          console.error('Error loading notifications:', error);
          this.notifications = [];
          this.filteredNotifications = [];
          this.paginatedNotifications = [];
        }
      );
    } else {
      this.notifications = [];
      this.filteredNotifications = [];
      this.paginatedNotifications = [];
    }
  }

  loadMoreNotifications(): void {
    this.currentBatch++;
    this.updatePaginatedNotifications();
  }

  loadUnreadCount(): void {
    if (this.data.employeeID) {
      this.medicalService.getUnreadNotificationsCount(this.data.employeeID).subscribe(
        (response: any) => {
          this.unreadCount = response.unreadCount || 0;
          this.updateFilteredNotifications();
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
        if (notification && !notification.isRead) {
          notification.isRead = true;
          this.updateFilteredNotifications();
          this.loadUnreadCount();
        }
      },
      error => {
        console.error('Error marking notification as read:', error);
        this.showErrorMessage(`Failed to mark notification as read. Please try again.`);
      }
    );
  }

  onRoomChange(event: Event): void {
    const roomType = (event.target as HTMLSelectElement).value;
    this.availableDoctors = [];
    this.notificationForm.get('doctorUserName')?.setValue('');

    if (roomType) {
      this.availableDoctors = this.rooms
        .filter(room => room.roomType === roomType && room.isActive)
        .map(room => ({
          userName: room.userName,
          fName: room.fName,
          mName: room.mName
        }))
        .filter((doctor, index, self) =>
          index === self.findIndex(d => d.userName === doctor.userName)
        );
      
      if (this.availableDoctors.length > 0) {
        this.notificationForm.get('doctorUserName')?.enable();
      } else {
        this.notificationForm.get('doctorUserName')?.disable();
      }
    } else {
      this.notificationForm.get('doctorUserName')?.disable();
    }
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
    if (this.notificationForm.valid && this.employeeID) {
      this.isSubmitting = true;
      let imageData: string | null = null;

      if (this.imageFile) {
        imageData = await this.readFileAsBase64(this.imageFile);
        imageData = imageData.split(',')[1]; // Remove data URL prefix
      }

      const notification = {
        userId: this.userId,
        employeeID: this.employeeID,
        message: this.notificationForm.value.message,
        timestamp: new Date(),
        imageData,
        recipientUserName: this.notificationForm.value.doctorUserName,
        priority: this.notificationForm.value.priority // Added priority
      };

      this.medicalService.createNotification(notification).subscribe(
        () => {
          this.isSubmitting = false;
          this.notificationForm.reset({ priority: 'Normal' });
          this.imagePreview = null;
          this.imageFile = null;
          this.loadNotifications();
          this.activeTab = 'view';
          this.dialogRef.close({ success: 'Notification sent successfully!' });
        },
        error => {
          this.isSubmitting = false;
          this.dialogRef.close({ error: 'Failed to send notification.' });
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

  onFilterChange(): void {
    this.currentBatch = 1;
    this.updateFilteredNotifications();
  }

  onSearchChange(): void {
    this.currentBatch = 1;
    this.updateFilteredNotifications();
  }

  onDateRangeChange(): void {
    this.currentBatch = 1;
    this.updateFilteredNotifications();
  }

  toggleArchived(): void {
    this.showArchived = !this.showArchived;
    this.currentBatch = 1;
    this.loadNotifications(); // Reload with/without archived notifications
  }

  updateFilteredNotifications(): void {
    let filtered = this.notifications;

    // Apply read/unread filter
    if (this.notificationFilter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    } else if (this.notificationFilter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    }

    // Apply priority filter
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority?.toLowerCase() === this.priorityFilter.toLowerCase());
    }

    // Apply date range filter
    if (this.dateRange.start && this.dateRange.end) {
      const startDate = new Date(this.dateRange.start);
      const endDate = new Date(this.dateRange.end);
      filtered = filtered.filter(n => {
        const notificationDate = new Date(n.timestamp);
        return notificationDate >= startDate && notificationDate <= endDate;
      });
    }

    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(n => n.message.toLowerCase().includes(query));
    }

    this.filteredNotifications = filtered;
    this.updatePaginatedNotifications();
  }

  updatePaginatedNotifications(): void {
    const endIndex = this.currentBatch * this.pageSize;
    this.paginatedNotifications = this.filteredNotifications.slice(0, endIndex);
  }

  openImagePreview(imageSrc: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageSrc },
      width: '800px'
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
}