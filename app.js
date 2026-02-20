/**
 * Finance Analytics Dashboard - JavaScript Application
 * 
 * Содержит:
 * - Обработка событий
 * - Манипуляция DOM-элементами
 * - Валидация форм
 * - Управление данными
 * - Интеграция с ApexCharts
 * - Экспорт данных
 * - Оптимизация производительности
 * 
 * @version 1.0.0
 * @author FinApp Development Team
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration & Constants
  // ==========================================================================

  const CONFIG = {
    STORAGE_KEY: 'finapp_data',
    STORAGE_KEY_SYNC: 'finapp_sync', // Ключ для данных синхронизации
    THEME_KEY: 'finapp_theme',
    PAGINATION: {
      ITEMS_PER_PAGE: 10,
      MAX_VISIBLE_PAGES: 5
    },
    ANIMATION: {
      DURATION: 300,
      DELAY: 50
    },
    VALIDATION: {
      MIN_AMOUNT: 0.01,
      MAX_AMOUNT: 999999999,
      DESCRIPTION_MIN_LENGTH: 3,
      DESCRIPTION_MAX_LENGTH: 200
    }
  };

  // Default Data
  const CLEAN_DEFAULT_DATA = {
    transactions: [],
    investments: [],
    categories: {
      income: ['Зарплата', 'Фриланс', 'Подработка', 'Бонус', 'Подарок', 'Инвестиции'],
      expense: ['Продукты', 'Транспорт', 'Коммунальные услуги', 'Развлечения', 'Одежда', 'Здоровье', 'Образование']
    }
  };

  // Legacy DEFAULT_DATA with test transactions (for reference only - DO NOT USE)
  const DEFAULT_DATA = {
    transactions: [
      { id: 1, date: '2026-02-13', description: 'Зарплата', amount: 50000, type: 'income', category: 'Зарплата' },
      { id: 2, date: '2026-02-12', description: 'Продукты', amount: 3500, type: 'expense', category: 'Продукты' },
      { id: 3, date: '2026-02-11', description: 'Транспорт', amount: 150, type: 'expense', category: 'Транспорт' },
      { id: 4, date: '2026-02-10', description: 'Фриланс', amount: 15000, type: 'income', category: 'Фриланс' },
      { id: 5, date: '2026-02-09', description: 'Коммунальные услуги', amount: 4500, type: 'expense', category: 'Коммунальные услуги' },
      { id: 6, date: '2026-02-08', description: 'Развлечения', amount: 2000, type: 'expense', category: 'Развлечения' },
      { id: 7, date: '2026-02-07', description: 'Подработка', amount: 8000, type: 'income', category: 'Подработка' },
      { id: 8, date: '2026-02-06', description: 'Одежда', amount: 5500, type: 'expense', category: 'Одежда' },
      { id: 9, date: '2026-02-05', description: 'Ресторан', amount: 3200, type: 'expense', category: 'Развлечения' },
      { id: 10, date: '2026-02-04', description: 'Инвестиции', amount: 10000, type: 'income', category: 'Инвестиции' },
      { id: 11, date: '2026-02-03', description: 'Медицина', amount: 2500, type: 'expense', category: 'Здоровье' },
      { id: 12, date: '2026-02-02', description: 'Образование', amount: 5000, type: 'expense', category: 'Образование' },
      { id: 13, date: '2026-02-01', description: 'Бонус', amount: 25000, type: 'income', category: 'Бонус' },
      { id: 14, date: '2026-01-31', description: 'Продукты', amount: 4200, type: 'expense', category: 'Продукты' },
      { id: 15, date: '2026-01-30', description: 'Такси', amount: 800, type: 'expense', category: 'Транспорт' }
    ],
    investments: [],
    categories: {
      income: ['Зарплата', 'Фриланс', 'Подработка', 'Бонус', 'Подарок', 'Инвестиции'],
      expense: ['Продукты', 'Транспорт', 'Коммунальные услуги', 'Развлечения', 'Одежда', 'Здоровье', 'Образование']
    }
  };

  // ==========================================================================
  // State Management
  // ==========================================================================

  class AppState {
    constructor() {
      this.syncData = this.loadSyncData();
      this.data = this.loadData();
      this.theme = this.loadTheme();
      this.currentSection = 'dashboard';
      this.pagination = {
        currentPage: 1,
        itemsPerPage: CONFIG.PAGINATION.ITEMS_PER_PAGE
      };
      this.sortConfig = {
        column: 'date',
        direction: 'desc'
      };
      this.filterConfig = {
        search: '',
        category: '',
        type: '',
        dateFrom: '',
        dateTo: ''
      };
    }

    // Загрузка данных синхронизации
    loadSyncData() {
      try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY_SYNC);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Проверяем, что данные синхронизации корректны
          if (parsed && typeof parsed.isFirstRun === 'boolean') {
            return parsed;
          }
        }
        
        // Первая инициализация - устройство новое
        // При первом запуске удаляем все старые данные, чтобы начать с чистого листа
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        
        const syncData = {
          isFirstRun: true,
          firstLaunchDate: new Date().toISOString(),
          lastSyncDate: null,
          deviceId: this.generateDeviceId()
        };
        localStorage.setItem(CONFIG.STORAGE_KEY_SYNC, JSON.stringify(syncData));
        return syncData;
      } catch (error) {
        console.error('Error loading sync data:', error);
        
        // В случае ошибки также удаляем старые данные для безопасности
        try {
          localStorage.removeItem(CONFIG.STORAGE_KEY);
        } catch(e) {
          console.error('Error clearing storage:', e);
        }
        
        return {
          isFirstRun: true,
          firstLaunchDate: new Date().toISOString(),
          lastSyncDate: null,
          deviceId: this.generateDeviceId()
        };
      }
    }

    // Генерация уникального ID устройства
    generateDeviceId() {
      let deviceId = localStorage.getItem('finapp_device_id');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('finapp_device_id', deviceId);
      }
      return deviceId;
    }

    // Сохранение данных синхронизации
    saveSyncData() {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY_SYNC, JSON.stringify(this.syncData));
        console.log('[SYNC] Sync data saved:', this.syncData);
      } catch (error) {
        console.error('Error saving sync data:', error);
      }
    }

    // Отметка о начале использования (после первой транзакции)
    markAsUsed() {
      console.log('[SYNC] markAsUsed called, current isFirstRun:', this.syncData.isFirstRun);
      if (this.syncData.isFirstRun) {
        this.syncData.isFirstRun = false;
        this.syncData.firstUseDate = new Date().toISOString();
        this.saveSyncData();
        console.log('[SYNC] Device marked as used - first transaction added');
      }
    }

    // Обновление даты последней синхронизации
    updateLastSync() {
      console.log('[SYNC] updateLastSync called');
      this.syncData.lastSyncDate = new Date().toISOString();
      this.saveSyncData();
    }

    loadData() {
      try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        console.log('[DEBUG] loadData - stored data exists:', !!stored);
        
        // При первом запуске (нет данных в localStorage) - показываем пустые данные
        if (!stored) {
          console.log('[DEBUG] loadData - first run, showing empty data');
          localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(CLEAN_DEFAULT_DATA));
          return CLEAN_DEFAULT_DATA;
        }
        
        // При последующих запусках - загружаем сохранённые данные
        const data = JSON.parse(stored);
        console.log('[DEBUG] loadData - loaded from localStorage, transactions:', data.transactions?.length || 0);
        
        // Ensure investments array exists
        if (!data.investments) {
          data.investments = [];
        }
        
        return data;
      } catch (error) {
        console.error('Error loading data:', error);
        return CLEAN_DEFAULT_DATA;
      }
    }

    saveData() {
      try {
        // Ensure investments array exists before saving
        if (!this.data.investments) {
          this.data.investments = [];
        }
        const dataString = JSON.stringify(this.data);
        console.log('[DEBUG] Saving data, transactions count:', this.data.transactions?.length || 0);
        console.log('[DEBUG] Data string length:', dataString.length);
        localStorage.setItem(CONFIG.STORAGE_KEY, dataString);
        console.log('[DEBUG] Data saved to localStorage');
        
        // Verify the data was saved correctly
        const verify = localStorage.getItem(CONFIG.STORAGE_KEY);
        console.log('[DEBUG] Verification - data exists:', !!verify);
        if (verify) {
          const parsed = JSON.parse(verify);
          console.log('[DEBUG] Verification - transactions count:', parsed.transactions?.length || 0);
        }
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }

    loadTheme() {
      try {
        return localStorage.getItem(CONFIG.THEME_KEY) || 'light';
      } catch (error) {
        return 'light';
      }
    }

    saveTheme(theme) {
      try {
        localStorage.setItem(CONFIG.THEME_KEY, theme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }

    resetData() {
      console.log('[DEBUG] resetData called');
      console.log('[DEBUG] Current transactions count:', this.data.transactions?.length || 0);
      this.data = CLEAN_DEFAULT_DATA;
      console.log('[DEBUG] After reset transactions count:', this.data.transactions?.length || 0);
      this.saveData();
      this.pagination.currentPage = 1;
      
      // Сброс синхронизации - устройство снова считается новым
      this.syncData.isFirstRun = true;
      this.syncData.firstLaunchDate = new Date().toISOString();
      this.syncData.firstUseDate = null;
      this.syncData.lastSyncDate = null;
      this.saveSyncData();
      console.log('[SYNC] Data and sync reset - device will show empty data on next launch');
      console.log('[DEBUG] Data reset to CLEAN_DEFAULT_DATA (empty transactions)');
    }
    
    // Полный сброс приложения к начальному состоянию
    fullReset() {
      console.log('[RESET] Performing full application reset');
      
      // Удаление всех данных из localStorage
      localStorage.removeItem(CONFIG.STORAGE_KEY);
      localStorage.removeItem(CONFIG.STORAGE_KEY_SYNC);
      localStorage.removeItem(CONFIG.THEME_KEY);
      
      // Сброс данных в состоянии к начальному
      this.data = CLEAN_DEFAULT_DATA;
      this.syncData = {
        isFirstRun: true,
        firstLaunchDate: new Date().toISOString(),
        lastSyncDate: null,
        deviceId: this.generateDeviceId()
      };
      
      // Сохранение сброшенных данных
      this.saveData();
      this.saveSyncData();
      
      console.log('[RESET] Application reset to initial state');
      console.log('[RESET] isFirstRun:', this.syncData.isFirstRun);
      console.log('[RESET] Transactions count:', this.data.transactions?.length || 0);
    }
  }

  // Global state instance
  const state = new AppState();

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  const Utils = {
    /**
     * Format number as currency (without currency symbol)
     */
    formatCurrency(amount) {
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    },

    /**
     * Format date for input
     */
    formatDateForInput(dateString) {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Generate unique ID
     */
    generateId() {
      return Date.now() + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Validate email
     */
    isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    /**
     * Validate amount
     */
    isValidAmount(amount) {
      const num = parseFloat(amount);
      return !isNaN(num) && num >= CONFIG.VALIDATION.MIN_AMOUNT && num <= CONFIG.VALIDATION.MAX_AMOUNT;
    },

    /**
     * Sanitize string
     */
    sanitize(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    /**
     * Get dates for current month
     */
    getCurrentMonthDates() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    },

    /**
     * Get dates for last month
     */
    getLastMonthDates() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    },

    /**
     * Get dates for current year
     */
    getCurrentYearDates() {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    }
  };

  // ==========================================================================
  // DOM Elements Cache
  // ==========================================================================

  const DOM = {
    body: document.body,
    sidebar: null,
    mainContent: null,
    sections: null,
    modal: null,
    transactionForm: null,
    kpiCards: null,
    dataTable: null,
    paginationInfo: null,
    paginationButtons: null
  };

  /**
   * Cache DOM elements
   */
  function cacheDOMElements() {
    DOM.sidebar = document.getElementById('sidebar');
    DOM.mainContent = document.querySelector('.main-content');
    DOM.sections = document.querySelectorAll('.section');
    DOM.modal = document.getElementById('transactionModal');
    DOM.transactionForm = document.getElementById('transactionForm');
    DOM.kpiCards = document.querySelectorAll('.kpi-card');
    DOM.dataTable = document.querySelector('.data-table');
    DOM.paginationInfo = document.querySelector('.pagination-info');
    DOM.paginationButtons = document.querySelector('.pagination-buttons');
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  const ThemeManager = {
    init() {
      this.setTheme(state.theme);
      this.bindEvents();
    },

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      state.theme = theme;
      state.saveTheme(theme);
      // Update charts theme
      if (Dashboard && Dashboard.initTheme) {
        Dashboard.initTheme();
      }
    },

    toggle() {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
      this.animateToggle();
    },

    animateToggle() {
      const toggle = document.querySelector('.toggle-switch');
      if (toggle) {
        toggle.style.transform = 'scale(1.1)';
        setTimeout(() => {
          toggle.style.transform = '';
        }, 200);
      }
    },

    bindEvents() {
      const toggle = document.querySelector('.toggle-switch');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }
    }
  };

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const Navigation = {
    init() {
      this.bindEvents();
    },

    showSection(sectionId) {
      // Update nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
          link.classList.add('active');
        }
      });

      // Show/hide sections
      DOM.sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId + 'Section') {
          section.classList.add('active');
        }
      });

      state.currentSection = sectionId;
      this.closeSidebarOnMobile();

      // Trigger section-specific updates
      if (sectionId === 'dashboard') {
        Dashboard.update();
      } else if (sectionId === 'transactions') {
        TransactionsTable.render();
      } else if (sectionId === 'analytics') {
        Analytics.update();
      }
    },

    toggleSidebar() {
      if (DOM.sidebar) {
        DOM.sidebar.classList.toggle('open');
      }
    },

    closeSidebarOnMobile() {
      if (window.innerWidth <= 992 && DOM.sidebar) {
        DOM.sidebar.classList.remove('open');
      }
    },

    bindEvents() {
      // Nav links
      document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.showSection(link.dataset.section);
        });
      });

      // Mobile menu button
      const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
      }

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', Utils.throttle((e) => {
        if (window.innerWidth <= 992 && 
            DOM.sidebar && 
            DOM.sidebar.classList.contains('open') &&
            !DOM.sidebar.contains(e.target) &&
            !e.target.closest('.mobile-menu-btn')) {
          DOM.sidebar.classList.remove('open');
        }
      }, 200));
    }
  };

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  const Dashboard = {
    charts: {},
    transferChart: null,
    trendsChart: null,

    init() {
      this.initCharts();
      this.update();
    },

    update() {
      this.updateKPIs();
      this.updateCharts();
    },

    getFilteredTransactions() {
      const { start, end } = this.getPeriodDates();
      return state.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    },

    getPeriodDates() {
      const period = document.getElementById('periodSelect')?.value || 'month';
      switch (period) {
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return { start: weekAgo, end: new Date() };
        case 'month':
          return Utils.getCurrentMonthDates();
        case 'lastMonth':
          return Utils.getLastMonthDates();
        case 'year':
          return Utils.getCurrentYearDates();
        default:
          return Utils.getCurrentMonthDates();
      }
    },

    updateKPIs() {
      const transactions = this.getFilteredTransactions();

      // Calculate income excluding investment returns
      const income = transactions
        .filter(t => t.type === 'income' && !t.isInvestmentReturn)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total investments (money moved from income to investments)
      const totalInvestments = (state.data.investments || [])
        .reduce((sum, inv) => sum + inv.amount, 0);

      // Calculate investment returns (money coming back from investments to income)
      const investmentReturns = transactions
        .filter(t => t.type === 'income' && t.isInvestmentReturn)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate actual available income (original income minus investments plus returns)
      const availableIncome = income - totalInvestments + investmentReturns;

      // Calculate expenses excluding investment transfers
      const expenses = transactions
        .filter(t => t.type === 'expense' && !t.isInvestmentTransfer)
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = availableIncome - expenses;
      const savings = availableIncome > 0 ? ((balance / availableIncome) * 100) : 0;

      // Calculate trends (compare to previous period)
      const prevPeriod = this.getPreviousPeriodDates();
      const prevTransactions = state.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= prevPeriod.start && date <= prevPeriod.end;
      });

      // Calculate previous period investments
      const prevInvestments = state.data.transactions
        .filter(t => {
          const date = new Date(t.date);
          return date >= prevPeriod.start && date <= prevPeriod.end;
        })
        .filter(t => t.isInvestmentTransfer)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate previous period investment returns
      const prevInvestmentReturns = prevTransactions
        .filter(t => t.type === 'income' && t.isInvestmentReturn)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate previous period income and expenses excluding investment transfers/returns
      const prevIncome = prevTransactions
        .filter(t => t.type === 'income' && !t.isInvestmentReturn)
        .reduce((sum, t) => sum + t.amount, 0);

      const prevAvailableIncome = prevIncome - prevInvestments + prevInvestmentReturns;

      const prevExpenses = prevTransactions
        .filter(t => t.type === 'expense' && !t.isInvestmentTransfer)
        .reduce((sum, t) => sum + t.amount, 0);

      const incomeTrend = prevAvailableIncome > 0 ? ((availableIncome - prevAvailableIncome) / prevAvailableIncome * 100) : 0;
      const expenseTrend = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses * 100) : 0;

      // Update DOM
      this.animateValue('balanceValue', balance);
      this.animateValue('incomeValue', availableIncome); // Use available income instead of raw income
      this.animateValue('expenseValue', expenses);

      // Update investment value
      document.getElementById('totalInvestments').textContent = Utils.formatCurrency(totalInvestments);

      this.updateTrend('balanceTrend', savings, true);
      this.updateTrend('incomeTrend', incomeTrend);
      this.updateTrend('expenseTrend', expenseTrend, true);
    },

    getPreviousPeriodDates() {
      const period = document.getElementById('periodSelect')?.value || 'month';
      const now = new Date();
      
      switch (period) {
        case 'week':
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return { start: twoWeeksAgo, end: weekAgo };
        case 'month':
          return Utils.getLastMonthDates();
        case 'lastMonth':
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return { start: twoMonthsAgo, end: lastMonthEnd };
        case 'year':
          return {
            start: new Date(now.getFullYear() - 1, 0, 1),
            end: new Date(now.getFullYear() - 1, 11, 31)
          };
        default:
          return Utils.getLastMonthDates();
      }
    },

    animateValue(elementId, value) {
      const element = document.getElementById(elementId);
      if (!element) return;

      const duration = 1000;
      const start = 0;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(start + (value - start) * easeOut);
        
        element.textContent = Utils.formatCurrency(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },

    updateTrend(elementId, value, inverse = false) {
      const element = document.getElementById(elementId);
      if (!element) return;

      const isPositive = inverse ? value < 0 : value > 0;
      const trendClass = isPositive ? 'positive' : 'negative';
      const arrow = value > 0 ? '↑' : '↓';
      
      element.className = 'kpi-trend ' + trendClass;
      element.innerHTML = `${arrow} ${Math.abs(value).toFixed(1)}%`;
    },

    initCharts() {
      // Main Chart (Area)
      const areaChartOptions = {
        series: [{
          name: 'Доходы',
          data: []
        }, {
          name: 'Расходы',
          data: []
        }],
        chart: {
          type: 'area',
          height: 300,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          zoom: { enabled: false }
        },
        colors: ['#10B981', '#EF4444'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 100]
          }
        },
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: {
          type: 'datetime',
          labels: {
            style: { colors: '#64748B' }
          }
        },
        yaxis: {
          labels: {
            style: { colors: '#64748B' },
            formatter: (val) => Utils.formatCurrency(val)
          }
        },
        grid: {
          borderColor: '#E2E8F0',
          strokeDashArray: 4
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right'
        },
        tooltip: {
          marker: { show: false },
          y: {
            formatter: (val) => Utils.formatCurrency(val)
          }
        }
      };

      this.charts.area = new ApexCharts(
        document.querySelector('#mainChart'),
        areaChartOptions
      );
      this.charts.area.render();

      // Donut Chart
      const donutOptions = {
        series: [],
        chart: {
          type: 'donut',
          height: 300,
          fontFamily: 'Inter, sans-serif'
        },
        colors: ['#6366F1', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'],
        labels: [],
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Всего',
                  formatter: (w) => Utils.formatCurrency(w.globals.seriesTotals.reduce((a, b) => a + b, 0))
                }
              }
            }
          }
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          marker: { show: false },
          custom: function({ series, seriesIndex, w }) {
            const label = w.globals.labels[seriesIndex];
            const value = Utils.formatCurrency(series[seriesIndex]);
            return '<div class="apexcharts-tooltip-custom">' +
              '<span class="apexcharts-tooltip-title">' + label + '</span>' +
              '<span class="apexcharts-tooltip-value">' + value + '</span>' +
            '</div>';
          },
          y: {
            formatter: (val) => Utils.formatCurrency(val)
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: false
        }
      };

      this.charts.donut = new ApexCharts(
        document.querySelector('#categoryChart'),
        donutOptions
      );
      this.charts.donut.render();

      // Инициализация столбчатого графика с переводами (Первый график)
      this.initTransferChart();

      // Инициализация графика трендов (Второй график)
      this.initTrendsChart();

      // Apply current theme to charts
      this.initTheme();
    },

    // Первый график: Динамика доходов и расходов с разбивкой по категориям и переводам
    initTransferChart() {
      const chartElement = document.querySelector('#barChart');
      if (!chartElement) return;

      const options = {
        series: [
          { name: 'Доходы', data: [] },
          { name: 'Переводы в сбережения', data: [] },
          { name: 'Переводы в инвестиции', data: [] }
        ],
        chart: {
          type: 'bar',
          height: 350,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          stacked: true
        },
        colors: ['#10B981', '#F59E0B', '#6366F1'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 4,
            borderRadiusApplication: 'end'
          }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: [],
          labels: {
            style: { colors: '#64748B' }
          }
        },
        yaxis: {
          labels: {
            style: { colors: '#64748B' },
            formatter: (val) => Utils.formatCurrency(val)
          }
        },
        grid: {
          borderColor: '#E2E8F0',
          strokeDashArray: 4
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          markers: { radius: 4 }
        },
        tooltip: {
          y: {
            formatter: (val) => Utils.formatCurrency(val)
          },
          shared: true
        }
      };

      this.transferChart = new ApexCharts(chartElement, options);
      this.transferChart.render();
    },

    // Второй график: Тренды за периоды с аналитикой поступлений и трат
    initTrendsChart() {
      const chartElement = document.querySelector('#lineChart');
      if (!chartElement) return;

      const options = {
        series: [
          { name: 'Доходы', data: [] },
          { name: 'Расходы', data: [] },
          { name: 'Сбережения', data: [] },
          { name: 'Инвестиции', data: [] }
        ],
        chart: {
          type: 'line',
          height: 350,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          zoom: { enabled: false }
        },
        colors: ['#10B981', '#EF4444', '#F59E0B', '#6366F1'],
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5,
          strokeWidth: 0,
          hover: { size: 7 }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: [],
          labels: {
            style: { colors: '#64748B' }
          }
        },
        yaxis: {
          labels: {
            style: { colors: '#64748B' },
            formatter: (val) => Utils.formatCurrency(val)
          }
        },
        grid: {
          borderColor: '#E2E8F0',
          strokeDashArray: 4
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right'
        },
        tooltip: {
          y: {
            formatter: (val) => Utils.formatCurrency(val)
          }
        }
      };

      this.trendsChart = new ApexCharts(chartElement, options);
      this.trendsChart.render();
    },

    initTheme() {
      const theme = state.theme || 'light';
      const isDark = theme === 'dark';
      const textColor = isDark ? '#CBD5E1' : '#64748B';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

      // Update Area Chart
      if (this.charts.area) {
        this.charts.area.updateOptions({
          theme: { mode: theme },
          xaxis: { labels: { style: { colors: textColor } } },
          yaxis: { labels: { style: { colors: textColor } } },
          grid: { borderColor: gridColor }
        });
      }

      // Update Donut Chart
      if (this.charts.donut) {
        this.charts.donut.updateOptions({
          theme: { mode: theme }
        });
      }

      // Update Heatmap
      if (this.heatmapChart) {
        this.heatmapChart.updateOptions({
          theme: { mode: theme },
          xaxis: { labels: { style: { colors: textColor } } },
          yaxis: { labels: { style: { colors: textColor } } }
        });
      }
    },

    updateCharts() {
      const transactions = this.getFilteredTransactions();
      
      // Update area chart
      const dailyData = this.getDailyData(transactions);
      this.charts.area.updateSeries([{
        name: 'Доходы',
        data: dailyData.income
      }, {
        name: 'Расходы',
        data: dailyData.expense
      }]);

      // Update donut chart
      const categoryData = this.getCategoryData(transactions);
      this.charts.donut.updateOptions({
        labels: categoryData.labels
      });
      this.charts.donut.updateSeries(categoryData.values);

      // Update category totals (income by category with percentages)
      this.updateCategoryTotals();
    },

    getDailyData(transactions) {
      const { start, end } = this.getPeriodDates();
      const incomeData = [];
      const expenseData = [];

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        // Calculate income excluding investment returns
        const income = dayTransactions
          .filter(t => t.type === 'income' && !t.isInvestmentReturn)
          .reduce((sum, t) => sum + t.amount, 0);

        // Calculate investment returns for this day
        const investmentReturns = dayTransactions
          .filter(t => t.type === 'income' && t.isInvestmentReturn)
          .reduce((sum, t) => sum + t.amount, 0);

        // Calculate investments made today (from income to investments)
        const dayInvestments = (state.data.investments || [])
          .filter(inv => inv.date === dateStr)
          .reduce((sum, inv) => sum + inv.amount, 0);

        // Calculate actual available income (income minus investments plus returns)
        const availableIncome = income - dayInvestments + investmentReturns;

        // Calculate expenses excluding investment transfers
        const expense = dayTransactions
          .filter(t => t.type === 'expense' && !t.isInvestmentTransfer)
          .reduce((sum, t) => sum + t.amount, 0);

        incomeData.push([new Date(currentDate).getTime(), availableIncome]); // Use available income
        expenseData.push([new Date(currentDate).getTime(), expense]);

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { income: incomeData, expense: expenseData };
    },

    getCategoryData(transactions) {
      // Filter out investment transfers from expenses
      const expenses = transactions.filter(t => t.type === 'expense' && !t.isInvestmentTransfer);
      const categoryTotals = {};

      expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

      const labels = Object.keys(categoryTotals);
      const values = Object.values(categoryTotals);

      return { labels, values };
    },

    getIncomeCategoryData(transactions) {
      // Filter income transactions
      const income = transactions.filter(t => t.type === 'income');
      const categoryTotals = {};

      income.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

      const labels = Object.keys(categoryTotals);
      const values = Object.values(categoryTotals);

      // Calculate total and percentages
      const total = values.reduce((a, b) => a + b, 0);
      const percentages = values.map(v => total > 0 ? Math.round((v / total) * 100) : 0);

      return { labels, values, total, percentages };
    },

    updateCategoryTotals() {
      const transactions = this.getFilteredTransactions();
      const incomeData = this.getIncomeCategoryData(transactions);
      
      const totalsContainer = document.getElementById('category-totals');
      if (!totalsContainer) return;

      if (incomeData.labels.length === 0) {
        totalsContainer.innerHTML = '<p class="text-secondary">Нет данных о доходах</p>';
        return;
      }

      const html = incomeData.labels.map((label, index) => `
        <div class="category-total-row">
          <span class="category-total-label">${label}</span>
          <span class="category-total-values">
            <span class="category-total-amount">${Utils.formatCurrency(incomeData.values[index])}</span>
            <span class="category-total-percent">${incomeData.percentages[index]}%</span>
          </span>
        </div>
      `).join('');

      totalsContainer.innerHTML = `
        <div class="category-totals-header">
          <span>Категория</span>
          <span>Сумма / %</span>
        </div>
        ${html}
        <div class="category-totals-summary">
          <span>Всего доходов:</span>
          <span>${Utils.formatCurrency(incomeData.total)}</span>
        </div>
      `;
    }
  };

  // ==========================================================================
  // Transactions Table
  // ==========================================================================

  const TransactionsTable = {
    init() {
      this.bindEvents();
      this.render();
    },

    getFilteredAndSortedTransactions() {
      let filtered = [...state.data.transactions];

      // Apply filters to regular transactions
      if (state.filterConfig.search) {
        const search = state.filterConfig.search.toLowerCase();
        filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
        );
      }

      if (state.filterConfig.category) {
        filtered = filtered.filter(t => t.category === state.filterConfig.category);
      }

      if (state.filterConfig.type) {
        filtered = filtered.filter(t => t.type === state.filterConfig.type);
      }

      if (state.filterConfig.dateFrom) {
        filtered = filtered.filter(t => t.date >= state.filterConfig.dateFrom);
      }

      if (state.filterConfig.dateTo) {
        filtered = filtered.filter(t => t.date <= state.filterConfig.dateTo);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal = a[state.sortConfig.column];
        let bVal = b[state.sortConfig.column];

        if (state.sortConfig.column === 'amount') {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }

        if (aVal < bVal) return state.sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return state.sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    },

    getPaginatedTransactions() {
      const filtered = this.getFilteredAndSortedTransactions();
      const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
      const end = start + state.pagination.itemsPerPage;
      return filtered.slice(start, end);
    },

    render() {
      this.renderTable();
      this.renderPagination();
    },

    renderTable() {
      const tbody = document.querySelector('#transactionsBody');
      if (!tbody) return;

      const transactions = this.getPaginatedTransactions();

      if (transactions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center" style="padding: 40px;">
              <p class="text-secondary">Нет транзакций для отображения</p>
            </td>
          </tr>
        `;
        return;
      }

      // Combine regular transactions with investment records for display
      const allRecords = [...transactions];
      
      // Add investment records as special transactions for display purposes
      if (state.data.investments) {
        state.data.investments.forEach(inv => {
          allRecords.push({
            id: inv.id,
            date: inv.date,
            description: inv.description,
            amount: inv.amount,
            type: 'investment',
            category: 'Инвестиции',
            isInvestmentRecord: true
          });
        });
      }
      
      // Sort all records by date (newest first)
      allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      tbody.innerHTML = allRecords.map(t => `
        <tr data-id="${t.id}">
          <td>${Utils.formatDate(t.date)}</td>
          <td class="${t.isInvestmentTransfer || t.isInvestmentReturn || t.isInvestmentRecord ? 'investment-transfer' : ''}">
            ${(t.isInvestmentTransfer ? '[Перевод в инвестиции] ' : '') + 
              (t.isInvestmentReturn ? '[Возврат из инвестиций] ' : '') +
              (t.isInvestmentRecord ? '[Инвестиция] ' : '') +
              Utils.sanitize(t.description)}
          </td>
          <td>
            <span class="category-badge ${t.type} ${t.category.replace(/\s+/g, '-')}" 
                  style="${t.isInvestmentTransfer || t.isInvestmentReturn || t.isInvestmentRecord ? 'opacity: 0.7;' : ''}">
              ${Utils.sanitize(t.category)}
            </span>
          </td>
          <td class="amount-cell ${t.type} ${t.isInvestmentTransfer || t.isInvestmentReturn || t.isInvestmentRecord ? 'investment-transfer' : ''}">
            ${(t.isInvestmentTransfer || t.isInvestmentReturn || t.isInvestmentRecord ? '→' : (t.type === 'income' ? '+' : '-'))}${Utils.formatCurrency(t.amount)}
          </td>
          <td class="${t.isInvestmentTransfer || t.isInvestmentReturn || t.isInvestmentRecord ? 'investment-transfer' : ''}">
            ${t.isInvestmentRecord ? 'Инвестиция' : t.isInvestmentTransfer ? 'Перевод' : t.isInvestmentReturn ? 'Возврат' : (t.type === 'income' ? 'Доход' : 'Расход')}
            <div class="transaction-actions">
              <button class="btn-edit" onclick="TransactionsTable.editTransaction(${t.id})" title="Редактировать" ${t.isInvestmentRecord ? 'style="display:none;"' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-delete" onclick="TransactionsTable.deleteTransaction(${t.id})" title="Удалить" ${t.isInvestmentRecord ? 'style="display:none;"' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Add CSS for investment transfer styling if not already added
      if (!document.querySelector('#investment-transfer-style')) {
        const style = document.createElement('style');
        style.id = 'investment-transfer-style';
        style.textContent = `
          .investment-transfer {
            font-style: italic;
            opacity: 0.8;
          }
        `;
        document.head.appendChild(style);
      }

      // Add sorting indicators
      this.updateSortIndicators();
    },

    renderPagination() {
      const filtered = this.getFilteredAndSortedTransactions();
      const totalPages = Math.ceil(filtered.length / state.pagination.itemsPerPage);
      const currentPage = state.pagination.currentPage;

      // Update info
      if (DOM.paginationInfo) {
        const start = (currentPage - 1) * state.pagination.itemsPerPage + 1;
        const end = Math.min(currentPage * state.pagination.itemsPerPage, filtered.length);
        DOM.paginationInfo.textContent = `Показано ${start}-${end} из ${filtered.length}`;
      }

      // Update buttons
      if (DOM.paginationButtons) {
        let buttons = '';

        // Previous button
        buttons += `
          <button class="btn-page" onclick="TransactionsTable.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ←
          </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            buttons += `
              <button class="btn-page ${i === currentPage ? 'active' : ''}" onclick="TransactionsTable.goToPage(${i})">
                ${i}
              </button>
            `;
          } else if (i === currentPage - 2 || i === currentPage + 2) {
            buttons += `<span class="btn-page" style="cursor: default;">...</span>`;
          }
        }

        // Next button
        buttons += `
          <button class="btn-page" onclick="TransactionsTable.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            →
          </button>
        `;

        DOM.paginationButtons.innerHTML = buttons;
      }
    },

    updateSortIndicators() {
      document.querySelectorAll('.data-table th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === state.sortConfig.column) {
          th.classList.add(state.sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
      });
    },

    goToPage(page) {
      const filtered = this.getFilteredAndSortedTransactions();
      const totalPages = Math.ceil(filtered.length / state.pagination.itemsPerPage);
      
      if (page >= 1 && page <= totalPages) {
        state.pagination.currentPage = page;
        this.render();
      }
    },

    sort(column) {
      if (state.sortConfig.column === column) {
        state.sortConfig.direction = state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortConfig.column = column;
        state.sortConfig.direction = 'desc';
      }
      state.pagination.currentPage = 1;
      this.render();
    },

    filter(config) {
      state.filterConfig = { ...state.filterConfig, ...config };
      state.pagination.currentPage = 1;
      this.render();
    },

    addTransaction(data) {
      const newTransaction = {
        id: Utils.generateId(),
        ...data,
        date: data.date || new Date().toISOString().split('T')[0]
      };

      // Ensure investment transfer flags are preserved
      if (data.isInvestmentTransfer) {
        newTransaction.isInvestmentTransfer = true;
      }
      if (data.isInvestmentReturn) {
        newTransaction.isInvestmentReturn = true;
      }

      state.data.transactions.unshift(newTransaction);
      state.saveData();
      
      // Синхронизация: отмечаем устройство как используемое после первой транзакции
      state.markAsUsed();
      state.updateLastSync();
      
      this.render();
      Dashboard.update();

      return newTransaction;
    },

    editTransaction(id) {
      const transaction = state.data.transactions.find(t => t.id === id);
      const investment = state.data.investments ? state.data.investments.find(i => i.id === id) : null;
      
      if (!transaction && !investment) return;

      // Prevent editing of investment records or investment transfer/return transactions
      if (investment || (transaction && (transaction.isInvestmentTransfer || transaction.isInvestmentReturn))) {
        alert('Невозможно редактировать транзакции инвестиционного перевода или инвестиционные записи');
        return;
      }

      // Open modal with data
      Modal.open(transaction);
    },

    updateTransaction(id, data) {
      const index = state.data.transactions.findIndex(t => t.id === id);
      if (index === -1) return false;

      // Preserve investment flags if they exist
      const existingTransaction = state.data.transactions[index];
      if (existingTransaction.isInvestmentTransfer) {
        data.isInvestmentTransfer = true;
      }
      if (existingTransaction.isInvestmentReturn) {
        data.isInvestmentReturn = true;
      }

      state.data.transactions[index] = { ...state.data.transactions[index], ...data };
      state.saveData();
      // Обновление даты синхронизации при изменении данных
      state.updateLastSync();
      this.render();
      Dashboard.update();

      return true;
    },

    deleteTransaction(id) {
      console.log('[DEBUG] deleteTransaction called with id:', id, 'type:', typeof id);
      console.log('[DEBUG] All transaction IDs:', state.data.transactions.map(t => ({id: t.id, type: typeof t.id})));
      const transaction = state.data.transactions.find(t => String(t.id) === String(id));
      const investmentIndex = state.data.investments ? state.data.investments.findIndex(i => String(i.id) === String(id)) : -1;
      
      console.log('[DEBUG] Found transaction:', transaction);
      console.log('[DEBUG] Investment index:', investmentIndex);
      
      if (!transaction && investmentIndex === -1) {
        console.log('[DEBUG] No transaction or investment found, returning');
        return;
      }

      // Handle investment records
      if (investmentIndex !== -1) {
        if (!confirm('Вы уверены, что хотите удалить эту инвестиционную запись?')) return;
        state.data.investments.splice(investmentIndex, 1);
      } 
      // Handle investment transfer/return transactions
      else if (transaction.isInvestmentTransfer || transaction.isInvestmentReturn) {
        if (!confirm('Вы уверены, что хотите удалить эту транзакцию инвестиционного перевода?')) return;
        state.data.transactions = state.data.transactions.filter(t => String(t.id) !== String(id));
      } else {
        if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) return;
        state.data.transactions = state.data.transactions.filter(t => String(t.id) !== String(id));
      }

      console.log('[DEBUG] Transactions after filter:', state.data.transactions.length);
      state.saveData();
      // Обновление даты синхронизации при удалении данных
      state.updateLastSync();
      this.render();
      Dashboard.update();
    },

    /**
     * Transfer funds from income to investments (internal transfer)
     */
    transferToInvestments(amount, description = 'Перевод в инвестиции') {
      if (amount <= 0) {
        alert('Введите корректную сумму для перевода');
        return false;
      }

      // Add investment transaction to history (as expense type with isInvestmentTransfer flag)
      const investmentTransaction = {
        id: Utils.generateId(),
        date: new Date().toISOString().split('T')[0],
        description: description,
        amount: amount,
        type: 'expense',
        category: 'Инвестиции',
        isInvestmentTransfer: true
      };

      state.data.transactions.unshift(investmentTransaction);
      
      // Add to investments array
      const investment = {
        id: investmentTransaction.id,
        date: new Date().toISOString().split('T')[0],
        description: description,
        amount: amount,
        originalType: 'income'
      };
      
      state.data.investments = state.data.investments || [];
      state.data.investments.push(investment);
      
      // Save the updated data
      state.saveData();
      
      // Синхронизация: отмечаем устройство как используемое
      state.markAsUsed();
      state.updateLastSync();
      
      this.render();
      Dashboard.update();
      
      return true;
    },

    /**
     * Return funds from investments back to income (internal transfer)
     */
    transferFromInvestments(amount, description = 'Возврат из инвестиций') {
      if (amount <= 0) {
        alert('Введите корректную сумму для возврата');
        return false;
      }

      // Find and remove from investments
      const investmentIndex = state.data.investments.findIndex(inv => inv.amount >= amount);
      let investmentId = null;
      if (investmentIndex !== -1) {
        // Store the investment ID for the return transaction
        investmentId = state.data.investments[investmentIndex].id;
        // Reduce the investment amount or remove if fully withdrawn
        const investment = state.data.investments[investmentIndex];
        if (investment.amount > amount) {
          // Partial withdrawal - reduce the investment amount
          investment.amount -= amount;
        } else {
          // Full withdrawal - remove the investment
          state.data.investments.splice(investmentIndex, 1);
        }
      } else {
        alert('Недостаточно средств для возврата');
        return false;
      }

      // Add return transaction to history (as income type with isInvestmentReturn flag)
      const returnTransaction = {
        id: Utils.generateId(),
        date: new Date().toISOString().split('T')[0],
        description: description,
        amount: amount,
        type: 'income',
        category: 'Инвестиции',
        isInvestmentReturn: true,
        originalInvestmentId: investmentId
      };

      state.data.transactions.unshift(returnTransaction);

      // Save the updated data
      state.saveData();
      
      // Синхронизация: обновляем дату синхронизации
      state.updateLastSync();
      
      this.render();
      Dashboard.update();
      
      return true;
    },

    bindEvents() {
      // Search input
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
          this.filter({ search: e.target.value });
        }, 300));
      }

      // Category filter
      const categoryFilter = document.getElementById('categoryFilter');
      if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
          this.filter({ category: e.target.value });
        });
      }

      // Type filter
      const typeFilter = document.getElementById('typeFilter');
      if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
          this.filter({ type: e.target.value });
        });
      }

      // Date filters
      const dateFromInput = document.getElementById('dateFrom');
      const dateToInput = document.getElementById('dateTo');
      
      if (dateFromInput) {
        dateFromInput.addEventListener('change', (e) => {
          this.filter({ dateFrom: e.target.value });
        });
      }
      
      if (dateToInput) {
        dateToInput.addEventListener('change', (e) => {
          this.filter({ dateTo: e.target.value });
        });
      }

      // Table header sorting
      document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
          this.sort(th.dataset.sort);
        });
      });
    }
  };

  // ==========================================================================
  // Modal
  // ==========================================================================

  const Modal = {
    isEdit: false,
    currentId: null,

    init() {
      this.bindEvents();
    },

    open(data = null) {
      if (!DOM.modal) return;

      // Check if it's an investment record or investment transfer/return transaction
      if (data && (data.isInvestmentRecord || data.isInvestmentTransfer || data.isInvestmentReturn)) {
        alert('Невозможно редактировать транзакции инвестиционного перевода или инвестиционные записи');
        return;
      }

      this.isEdit = !!data;
      this.currentId = data?.id || null;

      // Reset form
      const form = DOM.transactionForm;
      if (form) {
        form.reset();

        if (data) {
          // Fill form with data
          document.getElementById('description').value = data.description;
          document.getElementById('amount').value = data.amount;
          document.getElementById('date').value = Utils.formatDateForInput(data.date);
          document.getElementById('category').value = data.category;

          // Set type radio
          const typeRadio = document.querySelector(`input[name="type"][value="${data.type}"]`);
          if (typeRadio) typeRadio.checked = true;

          // Update categories
          this.updateCategoryOptions(data.type);

          document.querySelector('.modal-title').textContent = 'Редактировать транзакцию';
        } else {
          document.querySelector('.modal-title').textContent = 'Новая транзакция';
          this.updateCategoryOptions('expense');
        }
      }

      DOM.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!DOM.modal) return;
      
      DOM.modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Clear validation errors
      const form = DOM.transactionForm;
      if (form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
      }
    },

    updateCategoryOptions(type) {
      const categorySelect = document.getElementById('category');
      if (!categorySelect) return;

      const categories = state.data.categories[type] || [];
      categorySelect.innerHTML = categories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
    },

    validate() {
      const form = DOM.transactionForm;
      let isValid = true;

      // Clear previous errors
      form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      form.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');

      // Validate description
      const description = document.getElementById('description');
      if (!description.value || description.value.length < CONFIG.VALIDATION.DESCRIPTION_MIN_LENGTH) {
        this.showError(description, `Описание должно содержать минимум ${CONFIG.VALIDATION.DESCRIPTION_MIN_LENGTH} символов`);
        isValid = false;
      }

      // Validate amount
      const amount = document.getElementById('amount');
      if (!Utils.isValidAmount(amount.value)) {
        this.showError(amount, `Сумма должна быть от ${CONFIG.VALIDATION.MIN_AMOUNT} до ${CONFIG.VALIDATION.MAX_AMOUNT}`);
        isValid = false;
      }

      // Validate category
      const category = document.getElementById('category');
      if (!category.value) {
        this.showError(category, 'Выберите категорию');
        isValid = false;
      }

      // Validate date
      const date = document.getElementById('date');
      if (!date.value) {
        this.showError(date, 'Выберите дату');
        isValid = false;
      }

      // Validate type
      const type = document.querySelector('input[name="type"]:checked');
      if (!type) {
        const typeGroup = document.querySelector('.radio-group');
        if (typeGroup) {
          typeGroup.style.border = '1px solid var(--accent-danger)';
          setTimeout(() => typeGroup.style.border = '', 2000);
        }
        isValid = false;
      }

      return isValid;
    },

    showError(input, message) {
      input.classList.add('error');
      const formGroup = input.closest('.form-group');
      if (formGroup) {
        const errorEl = formGroup.querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.style.display = 'block';
        }
      }
    },

    submit(e) {
      e.preventDefault();

      if (!this.validate()) return;

      const form = DOM.transactionForm;
      const type = document.querySelector('input[name="type"]:checked').value;

      const data = {
        description: document.getElementById('description').value.trim(),
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        type: type
      };

      // Preserve investment flags if we're editing an investment transfer/return
      if (this.isEdit) {
        const existingTransaction = state.data.transactions.find(t => t.id === this.currentId);
        if (existingTransaction && existingTransaction.isInvestmentTransfer) {
          data.isInvestmentTransfer = true;
        }
        if (existingTransaction && existingTransaction.isInvestmentReturn) {
          data.isInvestmentReturn = true;
        }
      }

      if (this.isEdit) {
        TransactionsTable.updateTransaction(this.currentId, data);
      } else {
        TransactionsTable.addTransaction(data);
      }

      this.close();
    },

    bindEvents() {
      // Close modal on overlay click
      if (DOM.modal) {
        DOM.modal.addEventListener('click', (e) => {
          if (e.target === DOM.modal) {
            this.close();
          }
        });
      }

      // Close button
      const closeBtn = document.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.modal?.classList.contains('active')) {
          this.close();
        }
      });

      // Form submission
      if (DOM.transactionForm) {
        DOM.transactionForm.addEventListener('submit', (e) => this.submit(e));
      }

      // Type radio change
      document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.updateCategoryOptions(e.target.value);
        });
      });
    }
  };

  // ==========================================================================
  // Analytics
  // ==========================================================================

  const Analytics = {
    heatmapChart: null,

    init() {
      this.initHeatmap();
      this.update();
    },

    update() {
      this.updateHeatmap();
    },

    initHeatmap() {
      const options = {
        series: [{
          name: 'Трат',
          data: this.generateHeatmapData()
        }],
        chart: {
          height: 350,
          type: 'heatmap',
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false }
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 4,
            colorScale: {
              ranges: [
                { from: 0, to: 0, color: '#E2E8F0', name: 'Нет данных' },
                { from: 1, to: 1000, color: '#C7D2FE', name: 'Низкие' },
                { from: 1001, to: 3000, color: '#A5B4FC', name: 'Средние' },
                { from: 3001, to: 5000, color: '#818CF8', name: 'Высокие' },
                { from: 5001, to: 999999, color: '#6366F1', name: 'Очень высокие' }
              ]
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
          labels: {
            style: { colors: '#64748B' }
          }
        },
        tooltip: {
          marker: { show: false }
        },
        title: {
          text: 'Активность трат по дням недели',
          style: {
            fontSize: '16px',
            fontWeight: 600
          }
        }
      };

      const chartElement = document.querySelector('#heatmapChart');
      if (chartElement) {
        this.heatmapChart = new ApexCharts(chartElement, options);
        this.heatmapChart.render();
      }
    },

    generateHeatmapData() {
      const data = [];
      // Filter out investment transfers from expenses
      const transactions = state.data.transactions.filter(t => t.type === 'expense' && !t.isInvestmentTransfer);

      for (let week = 1; week <= 52; week++) {
        const weekData = [];

        for (let day = 0; day < 7; day++) {
          // Filter transactions for the specific day of the week
          const dayTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getDay() === day;
          });

          const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
          weekData.push(total || Math.floor(Math.random() * 5000));
        }

        data.push({
          x: `Нед ${week}`,
          y: weekData
        });
      }

      return data;
    },

    updateHeatmap() {
      if (this.heatmapChart) {
        this.heatmapChart.updateSeries([{
          name: 'Трат',
          data: this.generateHeatmapData()
        }]);
      }
    }
  };

  // ==========================================================================
  // Export Functions
  // ==========================================================================

  const Export = {
    init() {
      this.bindEvents();
    },

    async exportToExcel() {
      try {
        const XLSX = window.XLSX;
        const transactions = TransactionsTable.getFilteredAndSortedTransactions();
        
        const data = transactions.map(t => ({
          Дата: t.date,
          Описание: t.description,
          Категория: t.category,
          Тип: t.type === 'income' ? 'Доход' : 'Расход',
          Сумма: t.amount
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Транзакции');
        
        XLSX.writeFile(wb, `finapp_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        this.showNotification('Данные успешно экспортированы в Excel', 'success');
      } catch (error) {
        console.error('Excel export error:', error);
        this.showNotification('Ошибка экспорта в Excel', 'error');
      }
    },

    async exportToPDF() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const transactions = TransactionsTable.getFilteredAndSortedTransactions();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Финансовая аналитика', 14, 22);
        
        // Add date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);
        
        // Add summary
        doc.setFontSize(12);
        doc.setTextColor(0);
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        
        doc.text(`Доходы: ${Utils.formatCurrency(income)}`, 14, 45);
        doc.text(`Расходы: ${Utils.formatCurrency(expenses)}`, 14, 52);
        doc.text(`Баланс: ${Utils.formatCurrency(income - expenses)}`, 14, 59);
        
        // Add table
        doc.setFontSize(10);
        let yPos = 75;
        
        transactions.slice(0, 20).forEach((t, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const type = t.type === 'income' ? '↑' : '↓';
          const amount = `${type} ${Utils.formatCurrency(t.amount)}`;
          
          doc.text(t.date, 14, yPos);
          doc.text(t.description.substring(0, 30), 45, yPos);
          doc.text(t.category, 110, yPos);
          doc.text(amount, 160, yPos);
          
          yPos += 7;
        });
        
        doc.save(`finapp_export_${new Date().toISOString().split('T')[0]}.pdf`);
        
        this.showNotification('Данные успешно экспортированы в PDF', 'success');
      } catch (error) {
        console.error('PDF export error:', error);
        this.showNotification('Ошибка экспорта в PDF', 'error');
      }
    },

    async exportToImage() {
      try {
        const dashboardSection = document.getElementById('dashboardSection');
        if (!dashboardSection) return;

        const canvas = await html2canvas(dashboardSection, {
          scale: 2,
          backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary')
        });

        const link = document.createElement('a');
        link.download = `finapp_dashboard_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        this.showNotification('Изображение успешно сохранено', 'success');
      } catch (error) {
        console.error('Image export error:', error);
        this.showNotification('Ошибка экспорта изображения', 'error');
      }
    },

    showNotification(message, type = 'info') {
      // Remove existing notification
      const existing = document.querySelector('.notification');
      if (existing) existing.remove();

      // Create notification
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
      `;
      
      // Add styles
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6366F1',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: '2000',
        animation: 'slideInRight 0.3s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      });

      document.body.appendChild(notification);

      // Auto remove
      setTimeout(() => {
        notification.remove();
      }, 5000);
    },

    bindEvents() {
      // Excel export
      const excelBtn = document.getElementById('exportExcel');
      if (excelBtn) {
        excelBtn.addEventListener('click', () => this.exportToExcel());
      }

      // PDF export
      const pdfBtn = document.getElementById('exportPDF');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', () => this.exportToPDF());
      }

      // Image export
      const imageBtn = document.getElementById('exportImage');
      if (imageBtn) {
        imageBtn.addEventListener('click', () => this.exportToImage());
      }
    }
  };

  // ==========================================================================
  // Period Selector
  // ==========================================================================

  const PeriodSelector = {
    init() {
      const select = document.getElementById('periodSelect');
      if (select) {
        select.addEventListener('change', () => {
          Dashboard.update();
        });
      }
    }
  };

  // ==========================================================================
  // Add Transaction Button
  // ==========================================================================

  const AddTransactionBtn = {
    init() {
      const btn = document.getElementById('addTransactionBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          Modal.open();
        });
      }
    }
  };

  // ==========================================================================
  // Performance Optimization
  // ==========================================================================

  const Performance = {
    init() {
      // Lazy load charts on scroll
      if ('IntersectionObserver' in window) {
        const chartSections = document.querySelectorAll('.chart-card, .analytics-section');
        
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        chartSections.forEach(section => {
          section.style.opacity = '0';
          section.style.transition = 'opacity 0.5s ease';
          observer.observe(section);
        });
      }

      // Optimize scroll events
      window.addEventListener('scroll', Utils.throttle(() => {
        // Add scroll-based animations here if needed
      }, 100));

      // Preload critical resources
      this.preloadResources();
    },

    preloadResources() {
      // Preload fonts
      if (document.fonts && document.fonts.load) {
        document.fonts.load('10px Inter');
        document.fonts.load('10px Outfit');
      }
    }
  };

  // ==========================================================================
  // Global Functions (for inline handlers)
  // ==========================================================================

  window.toggleSidebar = function() {
    Navigation.toggleSidebar();
  };

  window.toggleTheme = function() {
    ThemeManager.toggle();
  };

  window.showSection = function(sectionId) {
    Navigation.showSection(sectionId);
  };

  window.transferToInvestments = function() {
    const amount = prompt('Введите сумму для перевода в инвестиции:');
    if (amount && parseFloat(amount) > 0) {
      const description = prompt('Введите описание перевода:', 'Перевод в инвестиции');
      TransactionsTable.transferToInvestments(parseFloat(amount), description || 'Перевод в инвестиции');
    }
  };

  window.transferFromInvestments = function() {
    const amount = prompt('Введите сумму для возврата из инвестиций:');
    if (amount && parseFloat(amount) > 0) {
      const description = prompt('Введите описание возврата:', 'Возврат из инвестиций');
      TransactionsTable.transferFromInvestments(parseFloat(amount), description || 'Возврат из инвестиций');
    }
  };

  // ==========================================================================
  // Initialize Application
  // ==========================================================================

  function initApp() {
    // Cache DOM elements
    cacheDOMElements();
    
    // Initialize modules
    ThemeManager.init();
    Navigation.init();
    Dashboard.init();
    TransactionsTable.init();
    Modal.init();
    Analytics.init();
    Export.init();
    PeriodSelector.init();
    AddTransactionBtn.init();
    Performance.init();

    // Add loaded class for animations
    document.body.classList.add('loaded');

    console.log('Finance Analytics Dashboard initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // Additional initialization for investment transfer functionality
  document.addEventListener('DOMContentLoaded', function() {
    // Add investment transfer styling if not already present
    if (!document.querySelector('#investment-transfer-style')) {
      const style = document.createElement('style');
      style.id = 'investment-transfer-style';
      style.textContent = `
        .investment-transfer {
          font-style: italic;
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }
  });

})();
