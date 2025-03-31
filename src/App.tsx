import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import AppLayout from './components/AppLayout';

// Lazy-load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TopArtistsPage = React.lazy(() => import('./pages/TopArtistsPage'));
const TopTracksPage = React.lazy(() => import('./pages/TopTracksPage'));
const PlaylistsPage = React.lazy(() => import('./pages/PlaylistsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Import loading component
import { TextSkeleton, CardSkeleton } from './components/Skeleton';

const LoadingFallback = () => (
  <div style={{ padding: theme.spacing.lg }}>
    <CardSkeleton height="200px" />
    <TextSkeleton width="80%" />
    <TextSkeleton width="60%" />
    <TextSkeleton width="70%" />
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={
              <Suspense fallback={<LoadingFallback />}>
                <HomePage />
              </Suspense>
            } />
            <Route path="top-artists" element={
              <Suspense fallback={<LoadingFallback />}>
                <TopArtistsPage />
              </Suspense>
            } />
            <Route path="top-tracks" element={
              <Suspense fallback={<LoadingFallback />}>
                <TopTracksPage />
              </Suspense>
            } />
            <Route path="playlists" element={
              <Suspense fallback={<LoadingFallback />}>
                <PlaylistsPage />
              </Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProfilePage />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App; 