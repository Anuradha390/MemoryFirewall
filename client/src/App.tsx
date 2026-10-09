import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return <ErrorBoundary><Switch>
    <Route path="/" component={Home} /><Route path="/overview" component={Home} /><Route path="/memories" component={Home} />
    <Route path="/replay" component={Home} /><Route path="/tests" component={Home} /><Route path="/guide" component={Home} /><Route path="/integrations" component={Home} /><Route path="/settings" component={Home} />
    <Route component={Home} />
  </Switch></ErrorBoundary>;
}
