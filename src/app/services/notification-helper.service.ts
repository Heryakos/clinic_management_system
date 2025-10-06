import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from './notification.service';
import { MedicalService } from '../medical.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationHelperService {

  constructor(
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private medicalService: MedicalService
  ) {}

  // Quick send notification method for components
  async quickSendNotification(recipientUserName: string, message: string, priority: 'Normal' | 'Urgent' = 'Normal'): Promise<boolean> {
    try {
      await this.notificationService.sendNotification({
        message,
        recipientUserName,
        priority
      });
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Open notification compose dialog
  openComposeDialog(defaultRecipient?: string): void {
    // For now, we'll use the old dialog approach until the new one is fully integrated
    import('../components/notification-dialog/notification-dialog.component').then(({ NotificationDialogComponent }) => {
      const dialogRef = this.dialog.open(NotificationDialogComponent, {
        width: '800px',
        maxWidth: '95vw',
        data: { 
          employeeID: null, 
          selectedDoctorUserName: defaultRecipient,
          defaultTab: 'send'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.success) {
          // Refresh notifications
          this.notificationService.refreshNotifications();
        }
      });
    });
  }

  // Get available doctors for a room type
  async getDoctorsByRoomType(roomType: string): Promise<any[]> {
    try {
      const rooms = await this.medicalService.getRooms().toPromise();
      const doctors = rooms
        ?.filter(room => room.RoomType === roomType && room.IsActive)
        .map(room => ({
          userName: room.UserName,
          fName: room.FName,
          mName: room.MName,
          fullName: `${room.FName} ${room.MName}`.trim()
        }))
        .filter((doctor, index, self) =>
          index === self.findIndex(d => d.userName === doctor.userName)
        ) || [];
      
      return doctors;
    } catch (error) {
      console.error('Error loading doctors:', error);
      return [];
    }
  }
} 