import { supabase } from './supabaseClient';
import { PerformanceMetrics, Submission } from '../types';

export const performanceService = {
  async getEnumeratorMetrics(projectId: string, enumeratorId: string): Promise<PerformanceMetrics> {
    // Query submissions for this enumerator in project
    // Note: Assumes submissions table has 'project_id' and 'enumerator_id' columns
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .eq('enumerator_id', enumeratorId);

    if (error) {
      console.error('Error fetching submissions for metrics:', error);
      return { enumeratorId, submissionCount: 0, errorRate: 0 };
    }

    const total = submissions?.length || 0;
    const rejected = submissions?.filter((s: Submission) => s.validationStatus === 'rejected').length || 0;
    const errorRate = total > 0 ? (rejected / total) * 100 : 0;

    // Avg completion time - simplistic, based on timestamp (note: without start time, set to 0; enhance with start_timestamp if added)
    let avgCompletionTime = 0;
    // To calculate properly, would need start_timestamp in Submission
    // For now, placeholder

    return {
      enumeratorId,
      submissionCount: total,
      errorRate,
      avgCompletionTime
    };
  },

  async getAllEnumeratorsMetrics(projectId: string): Promise<PerformanceMetrics[]> {
    // Fetch all enumerators for project (from organization_users or users table)
    const { data: users } = await supabase
      .from('organization_users') // Adjust table if needed
      .select('id')
      .eq('project_id', projectId) // Assume project_id link
      .in('role', ['enumerator']);

    const metrics = [];
    if (users) {
      for (const user of users) {
        const metric = await this.getEnumeratorMetrics(projectId, user.id);
        metrics.push(metric);
      }
    }
    return metrics;
  },

  // Real-time subscription for metrics updates
  subscribeToMetrics(projectId: string, callback: (metrics: PerformanceMetrics[]) => void) {
    const channel = supabase
      .channel(`metrics_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Refetch on any submission change
          const updatedMetrics = await this.getAllEnumeratorsMetrics(projectId);
          callback(updatedMetrics);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to performance metrics updates');
        }
      });

    return () => supabase.removeChannel(channel); // Unsubscribe function
  }
};
