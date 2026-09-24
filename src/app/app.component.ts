import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link, LinkService } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly linkService = inject(LinkService);

  readonly links = signal<Link[]>([]);
  readonly url = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  readonly submitting = signal(false);

  constructor() {
    this.loadLinks();
  }

  addLink(): void {
    const value = this.url().trim();
    if (!this.isHttpUrl(value)) {
      this.error.set('Enter a valid http:// or https:// URL.');
      this.notice.set('');
      return;
    }

    this.error.set('');
    this.notice.set('');
    this.submitting.set(true);
    this.linkService.create(value).subscribe({
      next: (link) => {
        this.url.set('');
        this.notice.set(`Short link ready: ${link.shortUrl}`);
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (response: HttpErrorResponse) => {
        this.error.set(this.errorMessage(response));
        this.submitting.set(false);
      }
    });
  }

  private loadLinks(): void {
    this.linkService.list().subscribe({
      next: (links) => this.links.set(links),
      error: (response: HttpErrorResponse) => this.error.set(this.errorMessage(response))
    });
  }

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private errorMessage(response: HttpErrorResponse): string {
    return response.error?.error || 'The backend is unavailable. Please try again.';
  }
}
