import { AuthProvider } from './context/AuthContext';
import { AsignaturaProvider } from './context/AsignaturaContext';
import { ItinerarioProvider } from './context/ItinerarioContext';
import { HorarioProvider } from './context/HorarioContext';

const AppProviders = ({ children }) => (
  <AuthProvider>
    <HorarioProvider>
      <AsignaturaProvider>
        <ItinerarioProvider>
          {children}
        </ItinerarioProvider>
      </AsignaturaProvider>
    </HorarioProvider>
  </AuthProvider>
);

export default AppProviders;
