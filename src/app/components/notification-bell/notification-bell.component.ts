import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { NotificationHelperService } from '../../services/notification-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
  animations: [
    trigger('slideDown', [
      state('closed', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      state('open', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('closed => open', animate('300ms ease-in-out')),
      transition('open => closed', animate('300ms ease-in-out'))
    ]),
    trigger('bellShake', [
      transition('* => shake', [
        animate('0.5s', style({ transform: 'rotate(-15deg)' })),
        animate('0.1s', style({ transform: 'rotate(15deg)' })),
        animate('0.1s', style({ transform: 'rotate(-15deg)' })),
        animate('0.1s', style({ transform: 'rotate(15deg)' })),
        animate('0.1s', style({ transform: 'rotate(0deg)' }))
      ])
    ])
  ]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @ViewChild('notificationPanel', { static: false }) notificationPanel!: ElementRef;
  
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  isLoading: boolean = false;
  bellState: string = 'normal';
  
  private subscriptions: Subscription[] = [];
  private previousUnreadCount: number = 0;

  constructor(
    private notificationService: NotificationService,
    private notificationHelper: NotificationHelperService,
    private dialog: MatDialog,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.initializeNotifications();
    this.subscribeToNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async initializeNotifications(): Promise<void> {
    this.isLoading = true;
    try {
      await this.notificationService.initializeNotifications();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private subscribeToNotifications(): void {
    // Subscribe to notifications
    const notificationsSub = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    );

    // Subscribe to unread count with animation trigger
    const unreadCountSub = this.notificationService.getUnreadCount().subscribe(
      count => {
        if (count > this.previousUnreadCount && this.previousUnreadCount > 0) {
          this.triggerBellAnimation();
        }
        this.previousUnreadCount = this.unreadCount;
        this.unreadCount = count;
      }
    );

    this.subscriptions.push(notificationsSub, unreadCountSub);
  }

  toggleNotificationPanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Mark notifications as read when panel is opened
      setTimeout(() => {
        this.markVisibleNotificationsAsRead();
      }, 500);
    }
  }

  private triggerBellAnimation(): void {
    this.bellState = 'shake';
    setTimeout(() => {
      this.bellState = 'normal';
    }, 600);
  }

  private async markVisibleNotificationsAsRead(): Promise<void> {
    const unreadNotifications = this.notifications.filter(n => !n.isRead).slice(0, 5); // First 5 visible
    for (const notification of unreadNotifications) {
      try {
        await this.notificationService.markAsRead(notification.notificationID);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  }

  async markAsRead(notificationId: number, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await this.notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async refreshNotifications(): Promise<void> {
    this.isLoading = true;
    try {
      await this.notificationService.refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openComposeDialog(): void {
    this.notificationHelper.openComposeDialog();
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  getPriorityClass(priority: string): string {
    return priority === 'Urgent' ? 'urgent' : 'normal';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    this.isOpen = false;
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.notificationID;
  }
} 