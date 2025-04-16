import React from "react";
import { render, screen } from "@testing-library/react";
import NavBar from "./Navbar";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { act } from "react";

// Mock window.innerWidth to simulate small screen
beforeAll(() => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 500, // Mobile width
  });
  window.dispatchEvent(new Event("resize"));
});

afterAll(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });


describe("NavBar component", () => {
  describe("when isNewTimeCardCreated is false", () => {
    beforeEach(() => {
      render(
        <BrowserRouter>
          <NavBar isNewTimeCardCreated={false} />
        </BrowserRouter>
      );
    });
    

    test("renders the logo image", () => {
      const logo = screen.getByAltText(/logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo.tagName).toBe("IMG");
    });

    test("renders the navbar title", () => {
      const headingElement = screen.getByText(/we care adult care timecards/i);
      expect(headingElement).toBeInTheDocument();
    });

    test("renders the Home link", () => {
      expect(screen.getByText(/home/i)).toBeInTheDocument();
    });

    test("renders the Tutorials link", () => {
      expect(screen.getByText(/tutorials/i)).toBeInTheDocument();
    });

    test("renders the Time Card Index link", () => {
      expect(screen.getByText(/time card index/i)).toBeInTheDocument();
    });

    test("renders the Reports link", () => {
      expect(screen.getByText(/reports/i)).toBeInTheDocument();
    });

    test("renders the Employees link", () => {
      expect(screen.getByText(/employees/i)).toBeInTheDocument();
    });

    test('renders "View / Create Time Card" link', () => {
      expect(screen.getByText(/view \/ create time card/i)).toBeInTheDocument();
    });

    test("Home link points to '/'", () => {
      const link = screen.getByRole("link", { name: /home/i });
      expect(link).toHaveAttribute("href", "/");
    });

    test("Tutorials link points to '/tutorials'", () => {
      const link = screen.getByRole("link", { name: /tutorials/i });
      expect(link).toHaveAttribute("href", "/tutorials");
    });

    test("Time Card Index link points to '/timeCardIndex'", () => {
      const link = screen.getByRole("link", { name: /time card index/i });
      expect(link).toHaveAttribute("href", "/timeCardIndex");
    });

    test("Reports link points to '/reports'", () => {
      const link = screen.getByRole("link", { name: /reports/i });
      expect(link).toHaveAttribute("href", "/reports");
    });

    test("Employees link points to '/employees'", () => {
      const link = screen.getByRole("link", { name: /employees/i });
      expect(link).toHaveAttribute("href", "/employees");
    });

    test("Time Card link points to '/createNewTimeCard' when inactive", () => {
      const link = screen.getByRole("link", {
        name: /view \/ create time card/i,
      });
      expect(link).toHaveAttribute("href", "/createNewTimeCard");
    });

    test("collapsible nav menu toggles 'show' class when hamburger is clicked", () => {
   
        const menu = screen.getByTestId("navbar-collapse");
        expect(menu.className).not.toContain("show");
      
        const toggleButton = screen.getByRole("button", { name: /toggle navigation/i });
        act(() => {
          toggleButton.click();
        });
      
        expect(menu.className).toContain("show");
      });
  });

  describe("when isNewTimeCardCreated is true", () => {
    test('renders "Active Time Card" when active', () => {
      render(
        <BrowserRouter>
          <NavBar isNewTimeCardCreated={true} />
        </BrowserRouter>
      );

      const link = screen.getByText(/active time card/i);
      expect(link).toBeInTheDocument();
    });

    test("Time Card link points to '/activeTimeCard' when active", () => {
      render(
        <BrowserRouter>
          <NavBar isNewTimeCardCreated={true} />
        </BrowserRouter>
      );
      const link = screen.getByRole("link", { name: /active time card/i });
      expect(link).toHaveAttribute("href", "/activeTimeCard");
    });
  });

  describe("Hamburger menu behavior", () => {
    test("toggles from ☰ to ✕ when clicked", () => {
      render(
        <BrowserRouter>
          <NavBar isNewTimeCardCreated={false} />
        </BrowserRouter>
      );

      // ☰ icon should be present
      expect(screen.getByText("☰")).toBeInTheDocument();

      const toggleButton = screen.getByRole("button", {
        name: /toggle navigation/i,
      });

      act(() => {
        toggleButton.click();
      });

      // ✕ icon should be present now
      expect(screen.getByText("✕")).toBeInTheDocument();
    });
  });


    describe("each route activates the correct nav link", () => {
    const routes = [
        { path: '/', name: /home/i },
        { path: '/tutorials', name: /tutorials/i },
        { path: '/createNewTimeCard', name: /view \/ create time card/i },
        { path: '/timeCardIndex', name: /time card index/i },
        { path: '/reports', name: /reports/i },
        { path: '/employees', name: /employees/i },
      ];
      
      test.each(routes)(
        "adds 'active' class to $path route",
        ({ path, name }) => {
          render(
            <MemoryRouter initialEntries={[path]}>
              <NavBar isNewTimeCardCreated={false} />
            </MemoryRouter>
          );
      
          const activeLink = screen.getByRole("link", { name });
          const parentLi = activeLink.closest("li");
          expect(parentLi).toHaveClass("active");
        }
      );
      
  });
  
});
