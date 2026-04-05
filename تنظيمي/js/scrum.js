/**
 * تنظيمي - Scrum Module
 * Professional Scrum Boards with Drag & Drop and Full CRUD
 */

import { dataManager } from './data-manager.js';

export class ScrumManager {
    constructor() {
        this.boards = [];
        this.currentBoardId = null;
        this.draggedCard = null;
        this.draggedFromColumn = null;
        
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.loadBoards();
        this.setupEventListeners();
    }

    cacheElements() {
        this.elements = {
            boardsContainer: document.getElementById('scrum-boards-container'),
            boardSelect: document.getElementById('board-select'),
            newBoardBtn: document.getElementById('new-board-btn'),
            newBoardInput: document.getElementById('new-board-input'),
            addCardInputs: {}
        };
    }

    setupEventListeners() {
        // New board
        this.elements.newBoardBtn?.addEventListener('click', () => this.createNewBoard());
        
        // Board select change
        this.elements.boardSelect?.addEventListener('change', (e) => {
            this.currentBoardId = e.target.value;
            this.renderCurrentBoard();
        });

        // Keyboard shortcut for adding cards
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('add-card-input')) {
                const column = e.target.dataset.column;
                if (column) {
                    this.addCard(column);
                }
            }
        });
    }

    loadBoards() {
        this.boards = dataManager.getScrumBoards();
        this.renderBoardSelector();
        
        if (this.boards.length > 0) {
            this.currentBoardId = this.boards[0].id;
            this.renderCurrentBoard();
        }
    }

    renderBoardSelector() {
        if (!this.elements.boardSelect) return;
        
        this.elements.boardSelect.innerHTML = this.boards.map(board => `
            <option value="${board.id}">${board.name}</option>
        `).join('');
    }

    renderCurrentBoard() {
        const board = this.boards.find(b => b.id === this.currentBoardId);
        if (!board || !this.elements.boardsContainer) return;

        this.elements.boardsContainer.innerHTML = `
            <div class="scrum-boards-container">
                ${this.renderColumn(board, 'todo', 'المهام')}
                ${this.renderColumn(board, 'inprogress', 'قيد التنفيذ')}
                ${this.renderColumn(board, 'done', 'مكتملة')}
            </div>
        `;

        this.setupDragAndDrop();
    }

    renderColumn(board, columnKey, columnTitle) {
        const cards = board.columns[columnKey] || [];
        
        return `
            <div class="scrum-column" data-column="${columnKey}">
                <div class="scrum-column-header">
                    <h3 class="scrum-column-title">${columnTitle}</h3>
                    <span style="background: var(--accent-gold); color: #1f2937; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                        ${cards.length}
                    </span>
                </div>
                
                <div class="add-card-container" style="margin-bottom: 15px;">
                    <input type="text" 
                           class="input-luxury add-card-input" 
                           data-column="${columnKey}"
                           placeholder="+ إضافة مهمة جديدة..."
                           style="padding: 10px;">
                </div>
                
                <div class="scrum-cards" data-column="${columnKey}">
                    ${cards.map(card => this.renderCard(card, columnKey)).join('')}
                </div>
            </div>
        `;
    }

    renderCard(card, columnKey) {
        const priorityColors = {
            'high': 'var(--accent-red)',
            'medium': 'var(--accent-gold)',
            'low': 'var(--accent-green)'
        };
        
        const priorityColor = priorityColors[card.priority] || 'var(--accent-blue)';
        
        return `
            <div class="scrum-card" 
                 draggable="true" 
                 data-card-id="${card.id}"
                 data-column="${columnKey}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: ${priorityColor}; color: #1f2937; font-weight: bold;">
                        ${this.getPriorityLabel(card.priority)}
                    </span>
                </div>
                <div style="font-weight: 600; margin-bottom: 8px;">${this.escapeHTML(card.title)}</div>
                ${card.description ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 10px;">${this.escapeHTML(card.description)}</div>` : ''}
                ${card.assignee ? `<div style="font-size: 0.8rem; opacity: 0.7;"><i class="fas fa-user"></i> ${this.escapeHTML(card.assignee)}</div>` : ''}
                <div class="scrum-card-actions">
                    <button class="btn-secondary" onclick="window.scrumManager.editCard('${card.id}', '${columnKey}')" style="padding: 4px 8px; font-size: 0.8rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="window.scrumManager.deleteCard('${card.id}', '${columnKey}')" style="padding: 4px 8px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setupDragAndDrop() {
        const cards = document.querySelectorAll('.scrum-card');
        const columns = document.querySelectorAll('.scrum-column');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => this.handleDragStart(e));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e));
            column.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    handleDragStart(e) {
        this.draggedCard = e.target;
        this.draggedFromColumn = e.target.dataset.column;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedCard = null;
        this.draggedFromColumn = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        
        const targetColumn = e.currentTarget.dataset.column;
        const cardsContainer = e.currentTarget.querySelector('.scrum-cards');
        
        if (!this.draggedCard || !targetColumn) return;

        const cardId = this.draggedCard.dataset.cardId;
        const toIndex = cardsContainer.children.length;

        // Move card in data
        const board = this.boards.find(b => b.id === this.currentBoardId);
        if (board) {
            dataManager.moveCard(this.currentBoardId, this.draggedFromColumn, targetColumn, cardId, toIndex);
            
            // Update local state
            const cardIndex = board.columns[this.draggedFromColumn].findIndex(c => c.id === cardId);
            const [card] = board.columns[this.draggedFromColumn].splice(cardIndex, 1);
            board.columns[targetColumn].push(card);
            
            this.renderCurrentBoard();
            
            // Add XP for moving card to done
            if (targetColumn === 'done') {
                dataManager.addXP(3);
            }
        }
    }

    addCard(column) {
        const input = document.querySelector(`.add-card-input[data-column="${column}"]`);
        const title = input?.value.trim();
        
        if (!title) return;

        const board = this.boards.find(b => b.id === this.currentBoardId);
        if (!board) return;

        const card = {
            title: title,
            description: '',
            priority: 'medium',
            assignee: '',
            tags: []
        };

        dataManager.addCardToColumn(this.currentBoardId, column, card);
        
        board.columns[column].push(card);
        
        if (input) input.value = '';
        
        this.renderCurrentBoard();
        dataManager.addXP(2);
    }

    editCard(cardId, column) {
        const board = this.boards.find(b => b.id === this.currentBoardId);
        if (!board) return;

        const card = board.columns[column].find(c => c.id === cardId);
        if (!card) return;

        const newTitle = prompt('تعديل العنوان:', card.title);
        if (newTitle === null) return;

        const newDescription = prompt('تعديل الوصف:', card.description || '');
        
        const priorities = ['low', 'medium', 'high'];
        const newPriority = prompt('الأولوية (low/medium/high):', card.priority) || card.priority;

        card.title = newTitle.trim() || card.title;
        card.description = newDescription?.trim() || '';
        card.priority = priorities.includes(newPriority) ? newPriority : card.priority;

        dataManager.updateCard(this.currentBoardId, column, cardId, card);
        this.renderCurrentBoard();
    }

    deleteCard(cardId, column) {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

        const board = this.boards.find(b => b.id === this.currentBoardId);
        if (!board) return;

        dataManager.deleteCard(this.currentBoardId, column, cardId);
        
        board.columns[column] = board.columns[column].filter(c => c.id !== cardId);
        this.renderCurrentBoard();
    }

    createNewBoard() {
        const name = prompt('اسم اللوحة الجديدة:');
        if (!name) return;

        const board = dataManager.createScrumBoard(name);
        this.boards.push(board);
        this.currentBoardId = board.id;
        
        this.renderBoardSelector();
        this.renderCurrentBoard();
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': 'عالية',
            'medium': 'متوسطة',
            'low': 'منخفضة'
        };
        return labels[priority] || priority;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Export singleton instance
export const scrumManager = new ScrumManager();
