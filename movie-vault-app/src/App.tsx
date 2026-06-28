import { Switch, Route, Router as WouterRouter } from "wouter";
import { AppProvider } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { MovieDetail } from "./pages/MovieDetail";
import { Favorites } from "./pages/Favorites";
import { Watchlist } from "./pages/Watchlist";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/watchlist" component={Watchlist} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <AppProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Navbar />
        <Router />
      </WouterRouter>
    </AppProvider>
  );
}
