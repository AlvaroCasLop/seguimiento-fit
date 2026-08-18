<script setup lang="ts">
import { ref } from 'vue';
import Navigation from './components/Navigation.vue';
import Dashboard from './components/Dashboard.vue';
import SessionLogger from './components/SessionLogger.vue';
import ExerciseCatalog from './components/ExerciseCatalog.vue';
import AnalyticsCharts from './components/AnalyticsCharts.vue';
import CalendarView from './components/CalendarView.vue';
import AuthModal from './components/AuthModal.vue';

const activeTab = ref('dashboard');
const showAuthModal = ref(false);
</script>

<template>
  <div className="app-container">
    <Navigation
      :activeTab="activeTab"
      @changeTab="tab => activeTab = tab"
      @openAuthModal="showAuthModal = true"
    />

    <main>
      <Dashboard
        v-if="activeTab === 'dashboard'"
        @goToLogger="activeTab = 'logger'"
        @goToAnalytics="activeTab = 'analytics'"
      />

      <SessionLogger
        v-else-if="activeTab === 'logger'"
        @sessionLogged="activeTab = 'dashboard'"
      />

      <ExerciseCatalog
        v-else-if="activeTab === 'exercises'"
      />

      <AnalyticsCharts
        v-else-if="activeTab === 'analytics'"
      />

      <CalendarView
        v-else-if="activeTab === 'calendar'"
      />
    </main>

    <AuthModal
      :isOpen="showAuthModal"
      @close="showAuthModal = false"
    />
  </div>
</template>
