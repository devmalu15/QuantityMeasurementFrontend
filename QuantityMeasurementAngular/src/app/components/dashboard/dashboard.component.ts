
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuantityService } from '../../services/quantity.service';
import { AuthService } from '../../services/auth.service';
import { QuantityDTO, MeasurementEntity } from '../../models/quantity.models';

const UNIT_GROUPS: { [key: string]: string[] } = {
  Length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  Weight: ['KILOGRAM', 'GRAM', 'POUND'],
  Volume: ['LITRE', 'MILLILITRE', 'GALLON'],
  Temperature: ['CELSIUS', 'FAHRENHEIT'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  unitGroups = UNIT_GROUPS;
  unit2Options: string[] = [];
  cvtToOptions: string[] = [];

  opType = 'add';
  val1 = '';
  unit1 = 'FEET';
  val2 = '';
  unit2 = 'FEET';
  opResult = '';
  opError = '';
  opLoading = false;

  cvtVal = '';
  cvtFrom = 'FEET';
  cvtTo = 'INCHES';
  cvtResult = '';
  cvtError = '';
  cvtLoading = false;

  history: MeasurementEntity[] = [];
  historyLoading = false;
  historyError = '';
  historyType = '';

  constructor(
    private readonly qty: QuantityService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  get isAuthenticated(): boolean {
    return this.auth.isLoggedIn;
  }

  ngOnInit(): void {
    this.syncUnit2();
    this.syncConversionUnits();
  }

  get groupCount(): number {
    return Object.keys(this.unitGroups).length;
  }

  get totalUnitCount(): number {
    return this.getAllUnits().length;
  }

  get currentFamily(): string {
    return this.getGroupForUnit(this.unit1) ?? 'Mixed units';
  }

  get currentConversionFamily(): string {
    const group = this.getGroupForUnit(this.cvtFrom);
    return group ? `${group} units` : 'Flexible';
  }

  get activeHistoryLabel(): string {
    if (this.historyType === 'redis') return 'Redis cache';
    if (this.historyType === 'ef') return 'Database';
    return 'Not selected';
  }

  get operationHelperText(): string {
    switch (this.opType) {
      case 'add':
        return 'Merge compatible quantities and keep a clean, readable output.';
      case 'subtract':
        return 'Find the difference between two measurements in the same family.';
      case 'divide':
        return 'Generate a quick ratio view for quantitative comparisons.';
      default:
        return 'Check whether two quantities represent the same measurable value.';
    }
  }

  get conversionHelperText(): string {
    return `Convert within ${this.getGroupForUnit(this.cvtFrom) ?? 'supported'} measurements with same-family validation.`;
  }

  getAllUnits(): string[] {
    return Object.values(this.unitGroups).flat();
  }

  getGroupForUnit(unit: string): string | null {
    return Object.entries(this.unitGroups)
      .find(([, units]) => units.includes(unit))?.[0] ?? null;
  }

  syncUnit2(): void {
    const group = this.getGroupForUnit(this.unit1);
    this.unit2Options = group ? this.unitGroups[group] : [];
    if (!this.unit2Options.includes(this.unit2)) {
      this.unit2 = this.unit2Options[0] ?? '';
    }
  }

  syncConversionUnits(): void {
    const group = this.getGroupForUnit(this.cvtFrom);
    this.cvtToOptions = group ? this.unitGroups[group] : [];

    if (!this.cvtToOptions.includes(this.cvtTo)) {
      this.cvtTo = this.cvtToOptions[0] ?? '';
    }

    this.cvtError = '';
    this.cvtResult = '';
  }

  toLabel(unit: string): string {
    return unit.charAt(0) + unit.slice(1).toLowerCase();
  }

  formatOperation(operation: string): string {
    if (!operation) return 'Operation';
    return operation
      .toLowerCase()
      .split(/[-_\s]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  runOperation(): void {
    if (!this.val1 || !this.val2) {
      this.opError = 'Please enter both values';
      return;
    }

    const v1 = Number.parseFloat(this.val1);
    const v2 = Number.parseFloat(this.val2);
    if (Number.isNaN(v1) || Number.isNaN(v2)) {
      this.opError = 'Values must be valid numbers';
      return;
    }

    const q1: QuantityDTO = { value: v1, unit: this.unit1 };
    const q2: QuantityDTO = { value: v2, unit: this.unit2 };
    const req = { q1, q2 };

    this.opLoading = true;
    this.opResult = '';
    this.opError = '';

    const handleResult = (res: any) => {
      this.opLoading = false;
      if (typeof res === 'boolean') this.opResult = `Equal: ${res}`;
      else if (typeof res === 'number') this.opResult = `Result: ${res}`;
      else this.opResult = `${res.value} ${this.toLabel(res.unit)}`;
    };

    const handleError = (err: any) => {
      this.opLoading = false;
      this.opError = err.error ?? 'Operation failed';
    };

    if (this.opType === 'add') this.qty.add(req).subscribe({ next: handleResult, error: handleError });
    else if (this.opType === 'subtract') this.qty.subtract(req).subscribe({ next: handleResult, error: handleError });
    else if (this.opType === 'divide') this.qty.divide(req).subscribe({ next: handleResult, error: handleError });
    else this.qty.compare(req).subscribe({ next: handleResult, error: handleError });
  }

  runConvert(): void {
    if (!this.cvtVal) {
      this.cvtError = 'Please enter a value';
      return;
    }

    const v = Number.parseFloat(this.cvtVal);
    if (Number.isNaN(v)) {
      this.cvtError = 'Value must be a valid number';
      return;
    }

    const fromGroup = this.getGroupForUnit(this.cvtFrom);
    const toGroup = this.getGroupForUnit(this.cvtTo);
    if (!fromGroup || !toGroup || fromGroup !== toGroup) {
      this.cvtResult = '';
      this.cvtError = 'Please choose units from the same measurement family';
      return;
    }

    this.cvtLoading = true;
    this.cvtResult = '';
    this.cvtError = '';

    this.qty.convert({ input: { value: v, unit: this.cvtFrom }, targetUnit: this.cvtTo })
      .subscribe({
        next: (res) => {
          this.cvtLoading = false;
          this.cvtResult = `${res.value} ${this.toLabel(res.unit)}`;
        },
        error: (err) => {
          this.cvtLoading = false;
          this.cvtError = err.error ?? 'Conversion failed';
        }
      });
  }

  loadHistory(type: 'redis' | 'ef'): void {
    if (type === 'ef' && !this.isAuthenticated) {
      this.historyError = 'Please login or register to access database history.';
      this.history = [];
      this.historyType = '';
      this.historyLoading = false;
      this.router.navigate(['/auth'], {
        queryParams: { returnUrl: '/dashboard' }
      });
      return;
    }

    this.historyLoading = true;
    this.historyError = '';
    this.historyType = type;
    this.history = [];

    this.qty.getHistory(type).subscribe({
      next: (data) => {
        this.historyLoading = false;
        this.history = data;
      },
      error: (err) => {
        this.historyLoading = false;
        this.historyError = err.error ?? 'Failed to load history';
      }
    });
  }
}
