// Singleton to manage global city context
class CityContextManager {
    private static instance: CityContextManager;
    private currentCity: string = 'Salvador';
    private listeners: ((city: string) => void)[] = [];
  
    private constructor() {
      console.log('[CityContext] Initializing with city: Salvador');
    }
  
    static getInstance(): CityContextManager {
      if (!CityContextManager.instance) {
        CityContextManager.instance = new CityContextManager();
      }
      return CityContextManager.instance;
    }
  
    setCurrentCity(city: string) {
      // Only update if city actually changes
      if (this.currentCity !== city) {
        console.log('[CityContext] Updating current city:', city);
        this.currentCity = city;
        this.notifyListeners();
      }
    }
  
    getCurrentCity(): string {
      return this.currentCity;
    }
  
    addListener(listener: (city: string) => void) {
      this.listeners.push(listener);
    }
  
    removeListener(listener: (city: string) => void) {
      this.listeners = this.listeners.filter(l => l !== listener);
    }
  
    private notifyListeners() {
      this.listeners.forEach(listener => listener(this.currentCity));
    }
  }
  
  export const cityContext = CityContextManager.getInstance();