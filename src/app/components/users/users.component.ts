import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { User } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  userForm!: FormGroup;
  users: User[] = [];
  isSubmitting = false;
  editingUserId: string | null = null;
  createdBy: string | null = null;
  searchText: string = '';
  filteredUsers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
    ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
    this.createdBy = environment.username || null;
    this.userForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.filterUsers());
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['Admin', Validators.required],
      department: [''],
      isActive: [true]
    });
  }
  loadUsers(): void {
    this.medicalService.getAllUsers().subscribe(
      requests => {
        this.users = requests;
        this.filterUsers(); // ✅ Call it here after setting this.users
      },
      error => {
        console.error('Error loading users:', error);
      }
    );
  }
  
  filterUsers(): void {
    if (!this.searchText) {
      this.filteredUsers = this.users;
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.Username.toLowerCase().includes(searchLower) ||
      user.FirstName.toLowerCase().includes(searchLower) ||
      user.LastName.toLowerCase().includes(searchLower) ||
      user.Email.toLowerCase().includes(searchLower) ||
      user.Role.toLowerCase().includes(searchLower) ||
      (user.Department && user.Department.toLowerCase().includes(searchLower))
    );
  }
  onSubmit(): void {
    if (this.userForm.valid && this.createdBy) {
      this.isSubmitting = true;
      const user: User = {
        ...this.userForm.value,
        CreatedBy: this.createdBy,
        UserID: this.editingUserId || null
      };

      if (this.editingUserId) {
        this.medicalService.updateUser(this.editingUserId, user).subscribe(
          () => {
            this.isSubmitting = false;
            this.cancelEdit();
            this.loadUsers();
          },
          error => {
            this.isSubmitting = false;
            console.error('Error updating user:', error);
          }
        );
      } else {
        this.medicalService.createUser(user).subscribe(
          () => {
            this.isSubmitting = false;
            this.userForm.reset({ role: 'Admin', isActive: true });
            this.loadUsers();
          },
          error => {
            this.isSubmitting = false;
            console.error('Error creating user:', error);
          }
        );
      }
    }
  }

  editUser(user: User): void {
    this.editingUserId = user.UserID;
    this.userForm.patchValue({
      username: user.Username,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      department: user.Department,
      isActive: user.IsActive
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.userForm.reset({ role: 'Admin', isActive: true });
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.medicalService.deleteUser(userId).subscribe(
        () => {
          this.loadUsers();
        },
        error => {
          console.error('Error deleting user:', error);
        }
      );
    }
  }
}