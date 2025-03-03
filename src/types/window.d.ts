// Add global sendMessage function to Window interface
interface Window {
  sendMessage?: (message: string) => void;
}