import { StoreProvider } from './hooks/useStorage';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
