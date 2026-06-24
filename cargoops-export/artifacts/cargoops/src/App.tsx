import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CargoProvider } from "./store/CargoContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Drivers } from "./pages/Drivers";
import { Offers } from "./pages/Offers";
import { Log } from "./pages/Log";
import { Report } from "./pages/Report";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center">
      <div className="text-5xl mb-4">404</div>
      <h2 className="text-xl font-bold mb-2">Page not found</h2>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/drivers" component={Drivers} />
        <Route path="/offers" component={Offers} />
        <Route path="/log" component={Log} />
        <Route path="/report" component={Report} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CargoProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </CargoProvider>
    </QueryClientProvider>
  );
}

export default App;
