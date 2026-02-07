import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  template: ''
})
export class RedirectFhcerpComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const path = window.location.pathname;
    if (!path.startsWith('/fhcerp')) {
      const newPath = '/fhcerp' + path;
      window.location.href = newPath; 
    }
  }
}
