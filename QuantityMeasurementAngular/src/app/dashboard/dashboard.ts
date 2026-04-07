import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { animate, stagger } from 'motion';
import { QuantityService } from '../quantity.service';
import { AuthService } from '../auth.service';
import { MeasurementEntity, QuantityDTO } from '../models';
import { Observable } from 'rxjs';

const UNIT_GROUPS: Record<string, string[]> = {
  Length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  Weight: ['KILOGRAM', 'GRAM', 'POUND'],
  Volume: ['LITRE', 'MILLILITRE', 'GALLON'],
  Temperature: ['CELSIUS', 'FAHRENHEIT'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      <!-- Background Elements -->
      <div class="fixed top-1/4 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div class="fixed bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-400/10 rounded-full blur-3xl -z-10 animate-pulse" style="animation-delay: 2s"></div>

      <!-- Header -->
      <header #header class="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div class="space-y-1">
          <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p class="text-slate-500 font-medium font-display">Precision measurement tools</p>
        </div>
        
        <div class="flex items-center gap-4 p-2 rounded-3xl liquid-glass pr-6 border border-white/40 shadow-xl">
          <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <mat-icon>{{ isGuest() ? 'person_outline' : 'person' }}</mat-icon>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {{ isGuest() ? 'Guest Mode' : 'Authenticated' }}
            </span>
            <span class="text-sm font-bold text-slate-700 truncate max-w-[150px]">
              {{ isGuest() ? 'Limited Access' : (email() || 'User') }}
            </span>
          </div>
          <button (click)="logout()" class="ml-4 p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <!-- Sidebar / Tools Selection -->
        <div #sidebar class="xl:col-span-4 space-y-6">
          <div class="card border border-white/50 shadow-2xl space-y-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 rounded-xl bg-blue-50 text-blue-600">
                <mat-icon>settings</mat-icon>
              </div>
              <h2 class="text-xl font-bold text-slate-800">Toolbox</h2>
            </div>

            <div class="space-y-4">
              <button (click)="activeTool.set('calc')" 
                      class="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border hover:scale-[1.02] active:scale-95"
                      [class.bg-blue-600]="activeTool() === 'calc'"
                      [class.text-white]="activeTool() === 'calc'"
                      [class.border-blue-500]="activeTool() === 'calc'"
                      [class.bg-white/40]="activeTool() !== 'calc'"
                      [class.text-slate-600]="activeTool() !== 'calc'"
                      [class.border-white/60]="activeTool() !== 'calc'">
                <div class="flex items-center gap-3">
                  <mat-icon>calculate</mat-icon>
                  <span class="font-bold">Calculator</span>
                </div>
                @if (activeTool() === 'calc') {
                  <mat-icon>chevron_right</mat-icon>
                }
              </button>

              <button (click)="activeTool.set('conv')" 
                      class="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border hover:scale-[1.02] active:scale-95"
                      [class.bg-indigo-600]="activeTool() === 'conv'"
                      [class.text-white]="activeTool() === 'conv'"
                      [class.border-indigo-500]="activeTool() === 'conv'"
                      [class.bg-white/40]="activeTool() !== 'conv'"
                      [class.text-slate-600]="activeTool() !== 'conv'"
                      [class.border-white/60]="activeTool() !== 'conv'">
                <div class="flex items-center gap-3">
                  <mat-icon>swap_horiz</mat-icon>
                  <span class="font-bold">Converter</span>
                </div>
                @if (activeTool() === 'conv') {
                  <mat-icon>chevron_right</mat-icon>
                }
              </button>
            </div>

            <div class="pt-6 border-t border-white/20">
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <mat-icon>history</mat-icon>
                </div>
                <h2 class="text-lg font-bold text-slate-800">History Source</h2>
              </div>
              
              <div class="flex flex-col gap-2">
                <button (click)="loadHistory('redis')" 
                        [disabled]="isGuest()"
                        class="flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border hover:bg-white/60"
                        [class.bg-white]="historyType() === 'redis'"
                        [class.border-blue-200]="historyType() === 'redis'"
                        [class.text-blue-600]="historyType() === 'redis'"
                        [class.text-slate-400]="historyType() !== 'redis' || isGuest()"
                        [class.border-transparent]="historyType() !== 'redis'">
                  <span>Cache Storage</span>
                  @if (isGuest()) {
                    <mat-icon class="!text-sm">lock</mat-icon>
                  }
                </button>
                <button (click)="loadHistory('ef')" 
                        [disabled]="isGuest()"
                        class="flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border hover:bg-white/60"
                        [class.bg-white]="historyType() === 'ef'"
                        [class.border-blue-200]="historyType() === 'ef'"
                        [class.text-blue-600]="historyType() === 'ef'"
                        [class.text-slate-400]="historyType() !== 'ef' || isGuest()"
                        [class.border-transparent]="historyType() !== 'ef'">
                  <span>Database</span>
                  @if (isGuest()) {
                    <mat-icon class="!text-sm">lock</mat-icon>
                  }
                </button>
              </div>
              @if (isGuest()) {
                <p class="mt-3 text-[10px] text-amber-600 font-bold uppercase tracking-wider text-center">
                  Sign in to access history
                </p>
              }
            </div>
          </div>
        </div>

        <!-- Main Workspace -->
        <div #workspace class="xl:col-span-8 space-y-8">
          <!-- Active Tool Content -->
          @if (activeTool() === 'calc') {
            <section #toolContent class="card border border-white/50 shadow-2xl space-y-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <mat-icon>calculate</mat-icon>
                  </div>
                  <h2 class="text-xl font-bold text-slate-800">Quantity Calculator</h2>
                </div>
                <div class="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                  {{ opType() }}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="space-y-1">
                    <label for="opType" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Operation</label>
                    <select id="opType" [(ngModel)]="opType" class="input-field appearance-none hover:border-blue-300">
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="divide">Divide</option>
                      <option value="compare">Compare</option>
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label for="val1" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Value 1</label>
                      <input id="val1" type="number" [(ngModel)]="val1" class="input-field hover:border-blue-300" placeholder="0.00">
                    </div>
                    <div class="space-y-1">
                      <label for="unit1" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Unit 1</label>
                      <select id="unit1" [(ngModel)]="unit1" (change)="syncUnit2()" class="input-field appearance-none hover:border-blue-300">
                        @for (group of unitGroups | keyvalue; track group.key) {
                          <optgroup [label]="group.key">
                            @for (u of group.value; track u) {
                              <option [value]="u">{{ u | titlecase }}</option>
                            }
                          </optgroup>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label for="val2" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Value 2</label>
                      <input id="val2" type="number" [(ngModel)]="val2" class="input-field hover:border-blue-300" placeholder="0.00">
                    </div>
                    <div class="space-y-1">
                      <label for="unit2" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Unit 2</label>
                      <select id="unit2" [(ngModel)]="unit2" class="input-field appearance-none hover:border-blue-300">
                        @for (u of unit2Options(); track u) {
                          <option [value]="u">{{ u | titlecase }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col justify-center items-center p-8 rounded-3xl bg-slate-50/50 border border-slate-100 relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  
                  @if (opResult()) {
                    <div class="text-center space-y-2 animate-fade-in">
                      <span class="text-xs font-bold uppercase tracking-widest text-blue-400">Calculation Result</span>
                      <div class="text-4xl font-extrabold text-blue-600 tracking-tight">{{ opResult() }}</div>
                    </div>
                  } @else {
                    <div class="text-center space-y-2 text-slate-400">
                      <mat-icon class="!text-4xl opacity-20">analytics</mat-icon>
                      <p class="text-sm font-medium">Enter values to see result</p>
                    </div>
                  }

                  <button (click)="runOperation()" [disabled]="opLoading()" class="btn btn-primary w-full mt-8 py-4 text-lg hover:scale-[1.02] active:scale-95">
                    @if (!opLoading()) {
                      <span>Calculate</span>
                    } @else {
                      <span class="flex items-center gap-2">
                        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Working...
                      </span>
                    }
                  </button>
                </div>
              </div>

              @if (opError()) {
                <div class="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium animate-fade-in">
                  {{ opError() }}
                </div>
              }
            </section>
          } @else {
            <section #toolContent class="card border border-white/50 shadow-2xl space-y-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <mat-icon>swap_horiz</mat-icon>
                  </div>
                  <h2 class="text-xl font-bold text-slate-800">Unit Converter</h2>
                </div>
                <div class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                  {{ cvtFrom() }} → {{ cvtTo() }}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="space-y-1">
                    <label for="cvtVal" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Input Value</label>
                    <input id="cvtVal" type="number" [(ngModel)]="cvtVal" class="input-field hover:border-indigo-300" placeholder="0.00">
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label for="cvtFrom" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">From Unit</label>
                      <select id="cvtFrom" [(ngModel)]="cvtFrom" (change)="syncConversionUnits()" class="input-field appearance-none hover:border-indigo-300">
                        @for (group of unitGroups | keyvalue; track group.key) {
                          <optgroup [label]="group.key">
                            @for (u of group.value; track u) {
                              <option [value]="u">{{ u | titlecase }}</option>
                            }
                          </optgroup>
                        }
                      </select>
                    </div>
                    <div class="space-y-1">
                      <label for="cvtTo" class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">To Unit</label>
                      <select id="cvtTo" [(ngModel)]="cvtTo" class="input-field appearance-none hover:border-indigo-300">
                        @for (u of cvtToOptions(); track u) {
                          <option [value]="u">{{ u | titlecase }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col justify-center items-center p-8 rounded-3xl bg-slate-50/50 border border-slate-100 relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-400/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  
                  @if (cvtResult()) {
                    <div class="text-center space-y-2 animate-fade-in">
                      <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Conversion Result</span>
                      <div class="text-4xl font-extrabold text-indigo-600 tracking-tight">{{ cvtResult() }}</div>
                    </div>
                  } @else {
                    <div class="text-center space-y-2 text-slate-400">
                      <mat-icon class="!text-4xl opacity-20">transform</mat-icon>
                      <p class="text-sm font-medium">Enter value to convert</p>
                    </div>
                  }

                  <button (click)="runConvert()" [disabled]="cvtLoading()" class="btn btn-primary w-full mt-8 py-4 text-lg !bg-indigo-600 !shadow-indigo-200 hover:!bg-indigo-700 hover:!shadow-indigo-300 hover:scale-[1.02] active:scale-95">
                    @if (!cvtLoading()) {
                      <span>Convert</span>
                    } @else {
                      <span class="flex items-center gap-2">
                        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Converting...
                      </span>
                    }
                  </button>
                </div>
              </div>

              @if (cvtError()) {
                <div class="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium animate-fade-in">
                  {{ cvtError() }}
                </div>
              }
            </section>
          }

          <!-- History Table -->
          <section #historySection class="card border border-white/50 shadow-2xl space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <mat-icon>history</mat-icon>
                </div>
                <h2 class="text-xl font-bold text-slate-800">Recent Activity</h2>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {{ historyType() === 'redis' ? 'Cache' : 'Database' }}
              </span>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-100">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50">
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Input</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (item of history().slice(0, 5); track item.id) {
                    <tr class="hover:bg-slate-50/30 transition-colors">
                      <td class="p-4">
                        <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                          {{ item.operation }}
                        </span>
                      </td>
                      <td class="p-4">
                        <div class="text-xs font-medium text-slate-500">{{ item.operand1 }}</div>
                        <div class="text-xs font-medium text-slate-500">{{ item.operand2 }}</div>
                      </td>
                      <td class="p-4 text-sm font-bold text-blue-600 font-mono">{{ item.result }}</td>
                    </tr>
                  }
                  @if (history().length === 0 && !historyLoading()) {
                    <tr>
                      <td colspan="3" class="p-8 text-center text-slate-400 font-medium italic text-sm">
                        {{ isGuest() ? 'History unavailable in guest mode' : 'No recent activity' }}
                      </td>
                    </tr>
                  }
                  @if (historyLoading()) {
                    <tr>
                      <td colspan="3" class="p-8 text-center">
                        <div class="flex items-center justify-center gap-3">
                          <span class="w-5 h-5 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></span>
                          <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing...</span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit, AfterViewInit {
  private qtyService = inject(QuantityService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // View Childs for animations
  private headerEl = viewChild<ElementRef>('header');
  private sidebarEl = viewChild<ElementRef>('sidebar');
  private workspaceEl = viewChild<ElementRef>('workspace');
  private toolContentEl = viewChild<ElementRef>('toolContent');
  private historySectionEl = viewChild<ElementRef>('historySection');

  unitGroups = UNIT_GROUPS;
  isGuest = signal(this.authService.isGuest);
  email = signal(this.authService.email);
  activeTool = signal<'calc' | 'conv'>('calc');

  opType = signal('add');
  val1 = signal<number | null>(null);
  unit1 = signal('FEET');
  val2 = signal<number | null>(null);
  unit2 = signal('FEET');
  opResult = signal('');
  opError = signal('');
  opLoading = signal(false);

  cvtVal = signal<number | null>(null);
  cvtFrom = signal('FEET');
  cvtTo = signal('INCHES');
  cvtResult = signal('');
  cvtError = signal('');
  cvtLoading = signal(false);

  history = signal<MeasurementEntity[]>([]);
  historyLoading = signal(false);
  historyError = signal('');
  historyType = signal<'redis' | 'ef'>('redis');

  unit2Options = computed(() => {
    const group = this.getGroupForUnit(this.unit1());
    return group ? this.unitGroups[group] : [];
  });

  cvtToOptions = computed(() => {
    const group = this.getGroupForUnit(this.cvtFrom());
    return group ? this.unitGroups[group] : [];
  });

  constructor() {
    // Effect to animate tool switching
    effect(() => {
      this.activeTool(); // Track dependency
      const el = this.toolContentEl()?.nativeElement;
      if (el) {
        animate(el, { opacity: [0, 1], x: [20, 0] }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
      }
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn && !this.authService.isGuest) {
      this.router.navigate(['/landing']);
      return;
    }
    this.loadHistory('redis');
  }

  ngAfterViewInit() {
    // Entrance animations
    if (this.headerEl()) {
      animate(this.headerEl()!.nativeElement, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.8 });
    }

    if (this.sidebarEl()) {
      const children = this.sidebarEl()!.nativeElement.children;
      animate(Array.from(children), { opacity: [0, 1], x: [-30, 0] }, { delay: stagger(0.1), duration: 0.8 });
    }

    if (this.workspaceEl()) {
      const sections = this.workspaceEl()!.nativeElement.querySelectorAll('section');
      animate(Array.from(sections), { opacity: [0, 1], y: [30, 0] }, { delay: stagger(0.15), duration: 0.8 });
    }
  }

  private getGroupForUnit(unit: string): string | null {
    return Object.entries(this.unitGroups)
      .find(([, units]) => units.includes(unit))?.[0] ?? null;
  }

  syncUnit2() {
    const options = this.unit2Options();
    if (!options.includes(this.unit2())) {
      this.unit2.set(options[0] || '');
    }
  }

  syncConversionUnits() {
    const options = this.cvtToOptions();
    if (!options.includes(this.cvtTo())) {
      this.cvtTo.set(options[0] || '');
    }
    this.cvtError.set('');
    this.cvtResult.set('');
  }

  runOperation() {
    if (this.val1() === null || this.val2() === null) {
      this.opError.set('Please enter both values');
      return;
    }

    this.opLoading.set(true);
    this.opResult.set('');
    this.opError.set('');

    const req = {
      q1: { value: this.val1()!, unit: this.unit1() },
      q2: { value: this.val2()!, unit: this.unit2() }
    };

    let obs: Observable<unknown>;
    if (this.opType() === 'add') obs = this.qtyService.add(req);
    else if (this.opType() === 'subtract') obs = this.qtyService.subtract(req);
    else if (this.opType() === 'divide') obs = this.qtyService.divide(req);
    else obs = this.qtyService.compare(req);

    obs.subscribe({
      next: (res: unknown) => {
        this.opLoading.set(false);
        if (typeof res === 'boolean') this.opResult.set(`Equal: ${res}`);
        else if (typeof res === 'number') this.opResult.set(`Result: ${res.toFixed(4)}`);
        else {
          const dto = res as QuantityDTO;
          this.opResult.set(`${dto.value.toFixed(4)} ${dto.unit.toLowerCase()}`);
        }
        this.loadHistory(this.historyType());
      },
      error: (err: { error?: string }) => {
        this.opLoading.set(false);
        this.opError.set(err.error || 'Operation failed');
      }
    });
  }

  runConvert() {
    if (this.cvtVal() === null) {
      this.cvtError.set('Please enter a value');
      return;
    }

    this.cvtLoading.set(true);
    this.cvtResult.set('');
    this.cvtError.set('');

    this.qtyService.convert({
      input: { value: this.cvtVal()!, unit: this.cvtFrom() },
      targetUnit: this.cvtTo()
    }).subscribe({
      next: (res) => {
        this.cvtLoading.set(false);
        this.cvtResult.set(`${res.value.toFixed(4)} ${res.unit.toLowerCase()}`);
        this.loadHistory(this.historyType());
      },
      error: (err: { error?: string }) => {
        this.cvtLoading.set(false);
        this.cvtError.set(err.error || 'Conversion failed');
      }
    });
  }

  loadHistory(type: 'redis' | 'ef') {
    if (this.isGuest()) {
      this.history.set([]);
      return;
    }

    this.historyLoading.set(true);
    this.historyType.set(type);

    this.qtyService.getHistory(type).subscribe({
      next: (data: MeasurementEntity[]) => {
        this.historyLoading.set(false);
        this.history.set(data.reverse());
      },
      error: () => {
        this.historyLoading.set(false);
        this.historyError.set('Failed to load history');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/landing']);
  }
}
