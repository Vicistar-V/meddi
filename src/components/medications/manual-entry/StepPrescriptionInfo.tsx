import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, Receipt } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';
import { RefillTracker } from './RefillTracker';

interface StepPrescriptionInfoProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
}

export const StepPrescriptionInfo = ({ formData, updateFormData }: StepPrescriptionInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Doctor Information */}
      <Card className="p-6 bg-gradient-cream shadow-warm border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Doctor Information</h3>
              <p className="text-xs text-muted-foreground">Optional - for your records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName" className="text-sm">Doctor Name</Label>
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) => updateFormData({ doctorName: e.target.value })}
                placeholder="e.g., Dr. Smith"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorPhone" className="text-sm">Phone Number</Label>
              <Input
                id="doctorPhone"
                type="tel"
                value={formData.doctorPhone}
                onChange={(e) => updateFormData({ doctorPhone: e.target.value })}
                placeholder="e.g., (555) 123-4567"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pharmacy Information */}
      <Card className="p-6 bg-gradient-warm-cream shadow-warm border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pharmacy Information</h3>
              <p className="text-xs text-muted-foreground">Optional - for your records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacyName" className="text-sm">Pharmacy Name</Label>
              <Input
                id="pharmacyName"
                value={formData.pharmacyName}
                onChange={(e) => updateFormData({ pharmacyName: e.target.value })}
                placeholder="e.g., CVS Pharmacy"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pharmacyPhone" className="text-sm">Phone Number</Label>
              <Input
                id="pharmacyPhone"
                type="tel"
                value={formData.pharmacyPhone}
                onChange={(e) => updateFormData({ pharmacyPhone: e.target.value })}
                placeholder="e.g., (555) 987-6543"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Prescription Details */}
      <Card className="p-6 bg-gradient-latte shadow-warm border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Prescription Details</h3>
              <p className="text-xs text-muted-foreground">Optional - helps track refills</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prescriptionNumber" className="text-sm">Prescription Number</Label>
              <Input
                id="prescriptionNumber"
                value={formData.prescriptionNumber}
                onChange={(e) => updateFormData({ prescriptionNumber: e.target.value })}
                placeholder="e.g., RX123456"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refillQuantity" className="text-sm">Quantity per Refill</Label>
              <Input
                id="refillQuantity"
                type="number"
                value={formData.refillQuantity}
                onChange={(e) => updateFormData({ refillQuantity: e.target.value })}
                placeholder="e.g., 30"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentQuantity" className="text-sm">Current Quantity</Label>
              <Input
                id="currentQuantity"
                type="number"
                value={formData.currentQuantity}
                onChange={(e) => updateFormData({ currentQuantity: e.target.value })}
                placeholder="e.g., 23"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastRefillDate" className="text-sm">Last Refill Date</Label>
              <Input
                id="lastRefillDate"
                type="date"
                value={formData.lastRefillDate}
                onChange={(e) => updateFormData({ lastRefillDate: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refillsRemaining" className="text-sm">Refills Remaining</Label>
              <Input
                id="refillsRemaining"
                type="number"
                value={formData.refillsRemaining}
                onChange={(e) => updateFormData({ refillsRemaining: e.target.value })}
                placeholder="e.g., 3"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-sm">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => updateFormData({ expirationDate: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerRefill" className="text-sm">Cost per Refill</Label>
              <Input
                id="costPerRefill"
                type="number"
                step="0.01"
                value={formData.costPerRefill}
                onChange={(e) => updateFormData({ costPerRefill: e.target.value })}
                placeholder="e.g., 15.99"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Refill Tracker */}
      {formData.currentQuantity && formData.schedules.length > 0 && (
        <RefillTracker
          currentQuantity={parseInt(formData.currentQuantity)}
          schedules={formData.schedules}
        />
      )}
    </div>
  );
};
