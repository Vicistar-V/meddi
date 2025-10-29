import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { MedicationsHeader } from '@/components/medications/MedicationsHeader';
import { MedicationSearchBar } from '@/components/medications/MedicationSearchBar';
import { MedicationListItem } from '@/components/medications/MedicationListItem';
import { MedicationFiltersCard } from '@/components/medications/MedicationFiltersCard';
import { WeeklyScheduleOverview } from '@/components/medications/WeeklyScheduleOverview';
import { EditMedicationDialog } from '@/components/medications/EditMedicationDialog';
import { AddScheduleDialog } from '@/components/medications/AddScheduleDialog';
import { EditScheduleDialog } from '@/components/medications/EditScheduleDialog';
import { DeleteScheduleDialog } from '@/components/medications/DeleteScheduleDialog';
import { InteractionDetailsDialog } from '@/components/medications/InteractionDetailsDialog';
import { InteractionScanButton } from '@/components/medications/InteractionScanButton';
import { useMedications, Medication, Schedule } from '@/hooks/useMedications';
import { useMedicationAdherence } from '@/hooks/useMedicationAdherence';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pill } from 'lucide-react';

const Medications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: userProfile } = useUserProfile();
  const targetUserId = userProfile?.patientId || userProfile?.user?.id;
  const isCaregiver = userProfile?.isCaregiver || false;
  const patientName = userProfile?.patientName || 'Patient';
  
  const {
    medications, 
    schedules, 
    todayLogs, 
    isLoading, 
    deleteMedication, 
    addSchedule,
    updateSchedule,
    deleteSchedule 
  } = useMedications(targetUserId);
  const { getMedicationAdherence, getWeeklyScheduleData, overallAdherence } = useMedicationAdherence(
    medications,
    schedules,
    todayLogs
  );

  // State
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'frequency'>('name');
  
  // Schedule management state
  const [addingScheduleForMed, setAddingScheduleForMed] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  
  // Interaction state
  const [interactionMedication, setInteractionMedication] = useState<{ name: string; interactions: any[] } | null>(null);

  // Filtered and sorted medications
  const filteredMedications = useMemo(() => {
    let filtered = medications.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter (active means has schedules)
    if (statusFilter === 'active') {
      filtered = filtered.filter(med =>
        schedules.some(s => s.medication_id === med.id)
      );
    }

    // Sort medications
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'frequency') {
        const aSchedules = schedules.filter(s => s.medication_id === a.id).length;
        const bSchedules = schedules.filter(s => s.medication_id === b.id).length;
        return bSchedules - aSchedules;
      }
      return 0;
    });

    return filtered;
  }, [medications, schedules, searchTerm, statusFilter, sortBy]);

  // Get schedules for a medication
  const getMedicationSchedules = (medicationId: string) => {
    return schedules.filter(s => s.medication_id === medicationId);
  };

  // Get logs for a medication
  const getMedicationLogs = (medicationId: string) => {
    const medSchedules = schedules.filter(s => s.medication_id === medicationId);
    const scheduleIds = medSchedules.map(s => s.id);
    return todayLogs.filter(log => scheduleIds.includes(log.schedule_id));
  };

  // Handlers
  const handleEdit = (medicationId: string) => {
    const med = medications.find(m => m.id === medicationId);
    if (med) {
      setEditingMedication(med);
    }
  };

  const handleDelete = (medicationId: string) => {
    setDeletingId(medicationId);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteMedication.mutateAsync(deletingId);
      toast({
        title: 'Medication deleted',
        description: 'The medication and all its schedules have been removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete medication',
        description: 'Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (
    medicationId: string,
    updates: Partial<Medication>,
    updatedSchedules: Schedule[]
  ) => {
    try {
      // Update medication
      const { error: medError } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', medicationId);

      if (medError) throw medError;

      toast({
        title: 'Medication updated',
        description: 'Your changes have been saved successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update medication',
        description: 'Please try again.',
      });
      throw error;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
  };

  // Schedule management handlers
  const handleAddSchedule = (medicationId: string) => {
    setAddingScheduleForMed(medicationId);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setDeletingScheduleId(scheduleId);
  };

  const confirmScheduleSave = async (medicationId: string, scheduleData: Omit<Schedule, 'id' | 'user_id'>) => {
    try {
      await addSchedule.mutateAsync(scheduleData);
      toast({
        title: 'Schedule added',
        description: 'The new schedule has been created successfully.',
      });
      setAddingScheduleForMed(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add schedule',
        description: 'Please try again.',
      });
    }
  };

  const confirmScheduleUpdate = async (scheduleId: string, updates: Partial<Schedule>) => {
    try {
      await updateSchedule.mutateAsync({ scheduleId, updates });
      toast({
        title: 'Schedule updated',
        description: 'Your changes have been saved successfully.',
      });
      setEditingSchedule(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update schedule',
        description: 'Please try again.',
      });
    }
  };

  const confirmScheduleDelete = async () => {
    if (!deletingScheduleId) return;
    
    try {
      await deleteSchedule.mutateAsync(deletingScheduleId);
      toast({
        title: 'Schedule deleted',
        description: 'The schedule has been removed.',
      });
      setDeletingScheduleId(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete schedule',
        description: 'Please try again.',
      });
    }
  };

  const handleViewInteractionDetails = (medicationName: string, interactions: any[]) => {
    setInteractionMedication({ name: medicationName, interactions });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading medications...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Empty state
  if (medications.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />
        <div className="container mx-auto px-4 py-6">
          <MedicationsHeader
            medicationCount={0}
            scheduleCount={0}
            adherenceRate={0}
            onAddClick={() => navigate('/medications/add')}
          />
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Pill className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No medications added yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Get started by adding your first medication to track your schedule and improve adherence.
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onAddClick={isCaregiver ? undefined : () => navigate('/medications/add')} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Caregiver Banner */}
        {isCaregiver && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Viewing {patientName}'s Medications</AlertTitle>
            <AlertDescription>
              You have read-only access. Only {patientName} can add, edit, or delete medications.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <MedicationsHeader
          medicationCount={medications.length}
          scheduleCount={schedules.length}
          adherenceRate={overallAdherence}
          onAddClick={isCaregiver ? undefined : () => navigate('/medications/add')}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
          {/* Left Column: Main Content */}
          <div className="space-y-4">
            <MedicationSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              medications={medications}
            />

            {/* Medications List */}
            <div className="space-y-3">
              {filteredMedications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No medications found. Try adjusting your filters.
                  </p>
                </div>
              ) : (
                filteredMedications.map((medication) => {
                  const medSchedules = getMedicationSchedules(medication.id);
                  const medLogs = getMedicationLogs(medication.id);
                  const adherenceRate = getMedicationAdherence(medication.id, 'week');

                  return (
                    <MedicationListItem
                      key={medication.id}
                      medication={medication}
                      schedules={medSchedules}
                      logs={medLogs}
                      adherenceRate={adherenceRate}
                      onEdit={isCaregiver ? undefined : handleEdit}
                      onDelete={isCaregiver ? undefined : handleDelete}
                      onAddSchedule={isCaregiver ? undefined : handleAddSchedule}
                      onEditSchedule={isCaregiver ? undefined : handleEditSchedule}
                      onDeleteSchedule={isCaregiver ? undefined : handleDeleteSchedule}
                      interactions={[]}
                      onViewInteractionDetails={() => handleViewInteractionDetails(medication.name, [])}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Right Sidebar: Filters & Stats */}
          <aside className="hidden lg:block space-y-6">
            <MedicationFiltersCard
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onReset={handleResetFilters}
              medications={medications}
            />
            <WeeklyScheduleOverview
              weeklyData={getWeeklyScheduleData}
              overallAdherence={overallAdherence}
            />
          </aside>
        </div>
      </div>

      <BottomNav />

      {/* Modals and Dialogs */}
      {editingMedication && (
        <EditMedicationDialog
          open={!!editingMedication}
          onOpenChange={(open) => !open && setEditingMedication(null)}
          medication={editingMedication}
          schedules={getMedicationSchedules(editingMedication.id)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Schedule Dialogs */}
      <AddScheduleDialog
        open={!!addingScheduleForMed}
        onOpenChange={(open) => !open && setAddingScheduleForMed(null)}
        medicationId={addingScheduleForMed || ''}
        medicationName={medications.find(m => m.id === addingScheduleForMed)?.name || ''}
        existingSchedules={getMedicationSchedules(addingScheduleForMed || '')}
        onSave={confirmScheduleSave}
      />

      <EditScheduleDialog
        open={!!editingSchedule}
        onOpenChange={(open) => !open && setEditingSchedule(null)}
        schedule={editingSchedule}
        medicationName={medications.find(m => m.id === editingSchedule?.medication_id)?.name || ''}
        onSave={confirmScheduleUpdate}
      />

      <DeleteScheduleDialog
        open={!!deletingScheduleId}
        onOpenChange={(open) => !open && setDeletingScheduleId(null)}
        schedule={schedules.find(s => s.id === deletingScheduleId) || null}
        isOnlySchedule={
          editingSchedule 
            ? getMedicationSchedules(editingSchedule.medication_id).length === 1 
            : false
        }
        onConfirm={confirmScheduleDelete}
      />

      {/* Interaction Details Dialog */}
      {interactionMedication && (
        <InteractionDetailsDialog
          open={!!interactionMedication}
          onOpenChange={(open) => !open && setInteractionMedication(null)}
          medicationName={interactionMedication.name}
          interactions={interactionMedication.interactions}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{medications.find(m => m.id === deletingId)?.name}</li>
                <li>{getMedicationSchedules(deletingId || '').length} associated schedule(s)</li>
                <li>All historical logs</li>
              </ul>
              <p className="mt-3 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Medications;
