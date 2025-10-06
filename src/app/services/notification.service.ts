import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { MedicalService } from '../medical.service';
import { environment } from 'src/environments/environment';

export interface Notification {
  notificationID: number;
  message: string;
  timestamp: Date;
  priority: 'Normal' | 'Urgent';
  isRead: boolean;
  imageData?: string;
  senderName?: string;
  recipientUserName: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private currentUser: string | null = null;
  private pollingInterval = 30000; // Poll every 30 seconds

  constructor(private medicalService: MedicalService) {
    this.currentUser = environment.username;
    this.startPolling();
  }

  // Getters for observables
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  // Initialize notifications for current user
  async initializeNotifications(): Promise<void> {
    if (this.currentUser) {
      await this.loadNotifications();
      await this.loadUnreadCount();
    }
  }

  // Load notifications from API
  private async loadNotifications(): Promise<void> {
    try {
      if (!this.currentUser) return;
      
      const notifications = await this.medicalService.getNotificationsByRecipientUserName(this.currentUser, false).toPromise();
      const formattedNotifications = notifications?.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp),
        imageData: notification.imageData ? `data:image/jpeg;base64,${notification.imageData}` : undefined
      })) || [];

      this.notifications$.next(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications$.next([]);
    }
  }

  // Load unread count
  private async loadUnreadCount(): Promise<void> {
    try {
      if (!this.currentUser) return;
      
      const response = await this.medicalService.getUnreadNotificationsCount(this.currentUser).toPromise();
      this.unreadCount$.next(response?.unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      this.unreadCount$.next(0);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await this.medicalService.markNotificationAsRead(notificationId).toPromise();
      
      // Update local state
      const currentNotifications = this.notifications$.value;
      const updatedNotifications = currentNotifications.map(notification => 
        notification.notificationID === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      this.notifications$.next(updatedNotifications);
      await this.loadUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const unreadNotifications = this.notifications$.value.filter(n => !n.isRead);
    
    for (const notification of unreadNotifications) {
      try {
        await this.markAsRead(notification.notificationID);
      } catch (error) {
        console.error(`Error marking notification ${notification.notificationID} as read:`, error);
      }
    }
  }

  // Send new notification
  async sendNotification(notification: {
    message: string;
    recipientUserName: string;
    priority?: 'Normal' | 'Urgent';
    imageData?: string;
  }): Promise<void> {
    try {
      const employeeData = await this.medicalService.getEmployeeById(environment.username).toPromise();
      const employee = employeeData?.c_Employees?.[0];
      
      if (!employee) {
        throw new Error('Employee data not found');
      }

      const notificationPayload = {
        userId: employee.user_ID,
        employeeID: employee.employee_Id,
        message: notification.message,
        timestamp: new Date(),
        imageData: notification.imageData,
        recipientUserName: notification.recipientUserName,
        priority: notification.priority || 'Normal'
      };

      await this.medicalService.createNotification(notificationPayload).toPromise();
      
      // Refresh notifications after sending
      await this.loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Start polling for new notifications
  private startPolling(): void {
    interval(this.pollingInterval).subscribe(() => {
      this.loadNotifications();
      this.loadUnreadCount();
    });
  }

  // Stop polling (call this when component is destroyed)
  stopPolling(): void {
    // Implementation for stopping polling if needed
  }

  // Refresh notifications manually
  async refreshNotifications(): Promise<void> {
    await this.loadNotifications();
    await this.loadUnreadCount();
  }
} 