import React, { createContext, useState } from 'react';

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshFlag, setRefreshFlag] = useState(0);

  const triggerRefresh = () => setRefreshFlag(prev => prev + 1);

  return (
    <RefreshContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};
