<script setup lang="ts">
import { ref } from 'vue';
import Navigation from './components/Navigation.vue';
import Dashboard from './components/Dashboard.vue';
import SessionLogger from './components/SessionLogger.vue';
import ExerciseCatalog from './components/ExerciseCatalog.vue';
import AnalyticsCharts from './components/AnalyticsCharts.vue';
import CalendarView from './components/CalendarView.vue';
import AuthModal from './components/AuthModal.vue';
import { WorkoutSession } from './types/fitness';

const activeTab = ref('dashboard');
const showAuthModal = ref(false);
const sessionToEdit = ref<WorkoutSession | null>(null);

const handleEditSession = (session: WorkoutSession) => {
  sessionToEdit.value = session;
  activeTab.value = 'logger';
};

const handleSessionLogged = () => {
  sessionToEdit.value = null;
  activeTab.value = 'dashboard';
};

const handleCancelEdit = () => {
  sessionToEdit.value = null;
  activeTab.value = 'dashboard';
};
</script>

<template>
  <div className="app-container">
    <Navigation
      :activeTab="activeTab"
      @changeTab="tab => { activeTab = tab; if (tab !== 'logger') sessionToEdit = null; }"
      @openAuthModal="showAuthModal = true"
    />

    <main>
      <Dashboard
        v-if="activeTab === 'dashboard'"
        @goToLogger="() => { sessionToEdit = null; activeTab = 'logger'; }"
        @goToAnalytics="activeTab = 'analytics'"
        @editSession="handleEditSession"
      />

      <SessionLogger
        v-else-if="activeTab === 'logger'"
        :sessionToEdit="sessionToEdit"
        @sessionLogged="handleSessionLogged"
        @cancelEdit="handleCancelEdit"
      />

      <ExerciseCatalog
        v-else-if="activeTab === 'exercises'"
      />

      <AnalyticsCharts
        v-else-if="activeTab === 'analytics'"
      />

      <CalendarView
        v-else-if="activeTab === 'calendar'"
        @editSession="handleEditSession"
      />
    </main>

    <AuthModal
      :isOpen="showAuthModal"
      @close="showAuthModal = false"
    />
  </div>
</template>
