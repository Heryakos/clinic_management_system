import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../services/notification.service';
import { MedicalService } from '../../medical.service';

@Component({
  selector: 'app-notification-compose',
  templateUrl: './notification-compose.component.html',
  styleUrls: ['./notification-compose.component.css']
})
export class NotificationComposeComponent implements OnInit {
  composeForm!: FormGroup;
  isSubmitting = false;
  imagePreview: string | null = null;
  imageFile: File | null = null;
  rooms: any[] = [];
  uniqueRoomTypes: string[] = [];
  availableDoctors: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private medicalService: MedicalService,
    public dialogRef: MatDialogRef<NotificationComposeComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadRooms();
  }

  initializeForm(): void {
    this.composeForm = this.fb.group({
      roomType: ['', Validators.required],
      doctorUserName: ['', Validators.required],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      priority: ['Normal', Validators.required]
    });
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
      }
    );
  }

  onRoomChange(event: Event): void {
    const roomType = (event.target as HTMLSelectElement).value;
    this.availableDoctors = [];
    this.composeForm.get('doctorUserName')?.setValue('');

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
        this.composeForm.get('doctorUserName')?.enable();
      } else {
        this.composeForm.get('doctorUserName')?.disable();
      }
    } else {
      this.composeForm.get('doctorUserName')?.disable();
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
    if (this.composeForm.valid) {
      this.isSubmitting = true;
      let imageData: string | undefined = undefined;

      if (this.imageFile) {
        imageData = await this.readFileAsBase64(this.imageFile);
        imageData = imageData.split(',')[1]; // Remove data URL prefix
      }

      try {
        await this.notificationService.sendNotification({
          message: this.composeForm.value.message,
          recipientUserName: this.composeForm.value.doctorUserName,
          priority: this.composeForm.value.priority,
          imageData
        });

        this.dialogRef.close({ success: 'Notification sent successfully!' });
      } catch (error) {
        console.error('Error sending notification:', error);
        this.dialogRef.close({ error: 'Failed to send notification.' });
      } finally {
        this.isSubmitting = false;
      }
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

  onCancel(): void {
    this.dialogRef.close();
  }
} 