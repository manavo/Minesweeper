var game = {
    board: null,
    validateButton: null,
    cheatButton: null,
    newButton: null,
    saveButton: null,
    loadButton: null,
    rowCount: 4,
    columnCount: 4,
    bombCount: 4,
    bombCells: [],
    gameOver: false,
    gameWon: false,
    cellsOpened: 0,

    init: function() {
        this.initButtons();

        var self = this;
        this.board.find('button').live('click', function() {
            self.handleMove($(this));
        });
        this.board.find('button').live('contextmenu', function() {
            if (self.gameOver == false) {
                $(this).toggleClass('flag');
            } else {
                self.gameEnded();
            }

            return false;
        });

        this.create();
    },

    initButtons: function() {
        var self = this;

        this.validateButton.click(function() {
            self.validate();
        });
        this.cheatButton.click(function() {
            self.toggleCheat();
        });
        this.newButton.click(function() {
            if (self.inProgress()) {
                if (confirm("Are you sure you want to quit this game and start a new one?") == true) {
                    newGame();
                }
            } else {
                newGame();
            }
        });
        this.saveButton.click(function() {
            var data = {
                html: self.board.html(),
                rowCount: self.rowCount,
                columnCount: self.columnCount,
                bombCount: self.bombCount,
                bombCells: self.bombCells,
                cellsOpened: self.cellsOpened
            };

            createCookie('game', JSON.stringify(data), 365);

            self.enableLoad();

            alert('Saved!');
        });
        this.loadButton.click(function() {
            var gameData = readCookie('game');
            if (gameData) {
                var data = $.parseJSON(gameData);

                self.gameOver = false;
                self.gameWon = false;
                self.board.html(data.html);
                self.rowCount = data.rowCount;
                self.columnCount = data.columnCount;
                self.bombCount = data.bombCount;
                self.bombCells = data.bombCells;
                self.cellsOpened = data.cellsOpened;

                self.board.find('button.bomb.show').removeClass('show');

                self.enableSave();
                self.enableCheat();
                self.cheatButton.removeClass('on');

                alert('Loaded');
            } else {
                alert('Failed to load the game');
            }
        });

        if (readCookie('game')) {
            this.enableLoad();
        } else {
            this.disableLoad();
        }
    },

    create: function() {
        var x,y,row,cell,bomb,index;

        this.board.empty();

        this.gameOver = false;
        this.gameWon = false;

        this.cellsOpened = 0;

        this.generateBombIndices();

        for(x=0; x<this.rowCount; x++) {
            row = $('<tr></tr>');

            for (y=0; y<this.columnCount; y++) {
                bomb = true;

                index = this.getIndexFromCoordinates(x, y);

                if ($.inArray(index, this.bombCells) == -1) {
                    bomb = false;
                }

                cell = $('<td><button data-x="'+x+'" data-y="'+y+'"></button></td>');
                if (bomb == true) {
                    cell.find('button').addClass('bomb');
                }
                row.append(cell);
            }

            this.board.append(row);
        }  

        this.disableSave();
        this.enableCheat();
        this.cheatButton.removeClass('on');
    },

    inProgress: function() {
        return (this.cellsOpened > 0 && this.gameOver == false);
    },

    gameEnded: function() {
        var message = "The game has ended. ";
        if (this.gameWon) {
            message += "You won!";
        } else {
            message += "You lost...";
        }
        alert(message);
    },

    validate: function() {
        if (this.gameOver == true) {
            this.gameEnded();
        } else {
            // this could have been an alternative to using this.cellsOpened
            // but it's probaly less efficient to have jQuery count on the fly,
            // instead of keeping track as the clicks happen
            // alert(this.board.find('button:disabled').length);

            if (this.getCellCount() - this.bombCells.length == this.cellsOpened) {
                this.gameWon = true;
                alert("Woohoo! You won!");
                this.endGame();
            } else {
                alert("Oh no! You didn't open all the tiles that weren't bombs. You lost!");
                this.endGame();
            }
        }
    },

    handleMove: function(button) {
        var bombsAround;

        if (this.gameOver == true) {
            this.gameEnded();
            return;
        }

        if (button.hasClass('flag')) {
            return;
        }

        button.prop('disabled', true).addClass('played');
        this.cellsOpened++;

        button.text('');

        if (this.isBomb(this.getButtonIndex(button)) == true) {
            button.addClass('clicked');
            this.endGame();
            alert('Oops! You hit a bomb, you lost!');
        } else {
            this.enableSave();

            bombsAround = this.bombsAround(button);
            if (bombsAround > 0) {
                button.text(bombsAround);
            }
        }
    },

    enableCheat: function() {
        this.cheatButton.prop('disabled', false);
    },

    disableCheat: function() {
        this.cheatButton.prop('disabled', true);
    },

    enableSave: function() {
        this.saveButton.prop('disabled', false);
    },

    disableSave: function() {
        this.saveButton.prop('disabled', true);
    },

    enableLoad: function() {
        this.loadButton.prop('disabled', false);
    },

    disableLoad: function() {
        this.loadButton.prop('disabled', true);
    },

    endGame: function() {
        this.disableSave();
        this.disableCheat();

        this.gameOver = true;
        this.showBombs();
        
        this.board.find('button').prop('disabled', true);
    },

    isBomb: function(index) {
        if ($.inArray(index, this.bombCells) == -1) {
            return false;
        } else {
            return true;
        }
    },

    showBombs: function() {
        this.board.find('.bomb').addClass('show');
    },

    toggleCheat: function() {
        this.board.find('.bomb').toggleClass('show');

        this.cheatButton.toggleClass('on');
    },

    hideBombs: function() {
        this.board.find('.bomb').removeClass('show');
    },

    bombsAround: function(button) {
        var x,y,i,bombsAroundCount;

        var coords = this.getButtonCoordinates(button);

        var checkCoords = [];

        for (x=coords.x-1; x<=coords.x+1; x++) {
            for (y=coords.y-1; y<=coords.y+1; y++) {
                if (x == coords.x && y == coords.y) {
                    // the button itself we clicked on, no need to check
                } else {
                    // avoid trying to check coords off the board bounds
                    if (x >= 0 && x < this.columnCount && y >= 0 && y < this.rowCount) {
                        checkCoords.push({x: x, y: y});
                    }
                }
            }
        }

        bombsAroundCount = 0;

        for (i in checkCoords) {
            var c = checkCoords[i];

            var index = this.getIndexFromCoordinates(c.x, c.y);

            if (this.isBomb(index)) {
                bombsAroundCount++;
            }
        }

        return bombsAroundCount;
    },

    getButtonIndex: function(button) {
        var coords = this.getButtonCoordinates(button);
        return this.getIndexFromCoordinates(coords.x, coords.y);
    },

    getButtonCoordinates: function(button) {
        return {x: parseInt(button.attr('data-x')), y: parseInt(button.attr('data-y'))};
    },

    getIndexFromCoordinates: function(x, y) {
        return parseInt(x*this.rowCount)+parseInt(y);
    },

    getCellCount: function() {
        return this.rowCount*this.columnCount;
    },

    generateBombIndices: function() {
        var i;

        this.bombCells = [];

        while (this.bombCells.length < this.bombCount) {
            var number = Math.floor(Math.random()*this.getCellCount());

            if ($.inArray(number, this.bombCells) == -1) {
                // not found, so add it
                this.bombCells.push(number);
            }
        };
    }
};

function newGame() {
    game.rowCount = 8;
    game.columnCount = 8;
    game.bombCount = 10;

    game.create();
}

$(document).ready(function() {
    game.board = $('#game');
    game.validateButton = $('.buttons button.validate');
    game.cheatButton = $('.buttons button.cheat');
    game.newButton = $('.buttons button.new');
    game.saveButton = $('.buttons button.save');
    game.loadButton = $('.buttons button.load');

    game.init();

    newGame();

    if (!readCookie('welcome')) {
        showWelcome();
        createCookie('welcome', 'shown', 365*5);
    }
});

function showWelcome() {
    var fade = $('#fade');

    fade.fadeTo('fast', 0.5);

    $('#welcome').animate({top: '100px'});
}

function dismissWelcome() {
    var fade = $('#fade');

    if (fade.is(':visible')) {
        fade.fadeTo('fast', 0, function() { $(this).hide(); });

        $('#welcome').animate({top: '-400px'});
    }
}

$(document).keyup(function(e) {
    if (e.keyCode == 27) { dismissWelcome(); }   // esc
});

window.onbeforeunload = function() {
    if (game.inProgress()) {
        return "Are you sure you want to quit this game?";
    }
};

// functions from: http://www.quirksmode.org/js/cookies.html
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}