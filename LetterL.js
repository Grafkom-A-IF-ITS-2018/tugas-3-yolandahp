
function LetterL() {
    Geometry.call(this);

    this.type = 'geometry';

    this.vertices = [];

    for (var i = 0; i < 6; i++){
        this.vertices = this.vertices.concat([
            -2, 3 - i*1, 0.0,
            -1, 3 - i*1, 0.0,
            -2, 2 - i*1, 0.0,
            -1, 3 - i*1, 0.0,
            -2, 2 - i*1, 0.0,
            -1, 2 - i*1, 0.0,
        ])
    }

    for (var i = 0; i < 3; i++){
        this.vertices = this.vertices.concat([
            -1 + i*1, -2, 0.0,
            -1 + i*1, -3, 0.0,
            0 + i*1, -2, 0.0,
            -1 + i*1, -3, 0.0,
            0 + i*1, -2, 0.0,
            0 + i*1, -3, 0.0,  
        ])
    }

    for (var i = 0; i < 6; i++){
        this.vertices = this.vertices.concat([
            -2, 3 - i*1, -1,
            -1, 3 - i*1, -1,
            -2, 2 - i*1, -1,
            -1, 3 - i*1, -1,
            -2, 2 - i*1, -1,
            -1, 2 - i*1, -1,
        ])
    }

    for (var i = 0; i < 3; i++){
        this.vertices = this.vertices.concat([
            -1 + i*1, -2, -1,
            -1 + i*1, -3, -1,
            0 + i*1, -2, -1,
            -1 + i*1, -3, -1,
            0 + i*1, -2, -1,
            0 + i*1, -3, -1,  
        ])
    }
    
    this.vertices = this.vertices.concat([
        //atas
        -2, 3, 0,
        -2, 3, -1,
        -1, 3, 0,
        -2, 3, -1,
        -1, 3, 0,
        -1, 3, -1,

        //tengah
        -1, -2, 0,
        -1, -2, -1,
        2, -2, 0,
        -1, -2, -1,
        2, -2, 0,
        2, -2, -1,

        //bawah
        -2, -3, 0.0,
        -2, -3, -1,
        2, -3, 0.0,
        -2, -3, -1,
        2, -3, 0.0,
        2, -3, -1,

        //tegak
        -2, 3, 0.0,
        -2, 3, -1,
        -2, -3, 0.0,
        -2, 3, -1,
        -2, -3, 0.0,
        -2, -3, -1,
        
        -1, 3, 0.0,
        -1, 3, -1,
        -1, -2, 0.0,
        -1, 3, -1,
        -1, -2, 0.0,
        -1, -2, -1,

        2, -2, 0.0,
        2, -2, -1,
        2, -3, 0.0,
        2, -2, -1,
        2, -3, 0.0,
        2, -3, -1,                    
    ])

    this.indices = [];
    for(var i = 0; i < this.vertices.length/3; i++){
        this.indices = this.indices.concat(i);
    }

    this.position = [];
    for (var i = 0; i < this.vertices.length/3; i++){
        this.position.push([this.vertices[i*3], this.vertices[i*3 +1], this.vertices[i*3 +2], 1.0])
    }

    this.vertices_ = Object.assign([], this.position);
    this.normals = [];
    this.textureCoord = [];
    
    for(let i = 0; i < this.vertices.length / 3; i++){
        this.textureCoord.push(0.0, 0.0);
    }
    
    for(let i = 0; i < this.vertices.length / 6; i++){
        this.normals.push(0.0, 0.0, 1.0);
    }
    
    for(let i = 0; i < this.vertices.length / 6; i++){
        this.normals.push(0.0, 1.0, 0.0);
    }

    var c1 = [1.0, 0.702, 0.8, 1.0,]
    var c2 = [1.0, 1.0, 0.8, 1.0,]
    var c3 = [0.949, 1.0, 0.212, 1.0,]
    var c4 = [0.8, 0.831, 1.0, 1.0,]
    var c5 = [1.0, 0.8, 0.8, 1.0,]
    var c6 = [0.902, 0.8, 1.0, 1.0,]

    var c = [c1, c2, c3, c4, c5, c6]

    this.colors = []
    for (var i = 0; i < 108; i++){
        this.colors = this.colors.concat(c[Math.floor((Math.random() * 10)) %6])
    }

    for (var i = 0; i < 36; i++){
        this.colors = this.colors.concat(c[0])
    }

    this.textureSrc = undefined;
}

LetterL.prototype.constructor = LetterL;

LetterL.prototype.render = function() {
    this.temporaryMatrixWorld = Object.assign({}, this.matrixWorld);
    document.addEventListener(this.id, this.action.bind(this));
}

LetterL.prototype.findCenter = function() {
    let center = [0, 0, 0];
    for(let i = 0; i < this.position.length / 2; i++){
        center[0] += this.position[i][0];
        center[1] += this.position[i][1];
        center[2] += this.position[i][2];
    }
    center[0] /= this.position.length / 2;
    center[1] /= this.position.length / 2;
    center[2] /= this.position.length / 2;
    return center;
}

LetterL.prototype.action = function() {

}