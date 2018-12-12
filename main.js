var gl;

function WebGL(id){
    var canvas = document.getElementById(id);
    gl = canvas.getContext('experimental-webgl');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    function initShaders() {
        var fragmentShader = getShader('shader-fs');
        var vertexShader = getShader('shader-vs');

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);


        if(!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert("Tidak bisa menghubungkan shader-shader");
        }

        gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        
        this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexNormalAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

        this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.shaderProgram.nMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uNMatrix");
        this.shaderProgram.samplerUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.useLightingUniform = gl.getUniformLocation(this.shaderProgram, "uUseLighting");
        this.shaderProgram.ambientColorUniform = gl.getUniformLocation(this.shaderProgram, "uAmbientColor");
        this.shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingLocation");
        this.shaderProgram.pointLightingColorUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingColor");
        this.shaderProgram.alphaUniform = gl.getUniformLocation(this.shaderProgram, "uAlpha");
        this.shaderProgram.shineUniform = gl.getUniformLocation(this.shaderProgram, "uShine");
    }

    initShaders = initShaders.bind(this);
    initShaders();
    
    this.mvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create(),
    }
    
    this.pvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create(),
    }
    this.mvMatrixStack = {
        '1' : [],
        '2' : [],
        '3' : [],
        '4' : [],
    }    

    this.objectBuffer = [];

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

function getShader(id) {
    var shaderScript = document.getElementById(id);

    var str = '';
    var k = shaderScript.firstChild;
    
    while(k){
        if(k.nodeType == 3){
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;

    if (shaderScript.type == 'x-shader/x-fragment'){
        shader = gl.createShader(gl.FRAGMENT_SHADER)
    } else if (shaderScript.type == 'x-shader/x-vertex' ){
        shader = gl.createShader(gl.VERTEX_SHADER);                   
    } else{
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    texture.loaded = true;
}

WebGL.prototype.mvPushMatrix = function(idx) {
    var duplicate = mat4.create();

    var mvMat = this.mvMatrix[idx];
    var mvMatStack = this.mvMatrixStack[idx];

    mat4.copy(duplicate, mvMat);
    mvMatStack.push(duplicate);
}

WebGL.prototype.mvPopMatrix = function(idx) {
    this.mvMatrix[idx] = this.mvMatrixStack[idx].pop();
}

WebGL.prototype.setMatrixUniform = function(idx) {
    var normalMatrix = mat3.create();

    var mvMat = this.mvMatrix[idx];
    var pMat = this.pvMatrix[idx];

    mat3.normalFromMat4(normalMatrix, mvMat);

    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMat);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMat);
    gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
}

WebGL.prototype.add = function(object) {
    var buffer = {}
    if(object.type === 'geometry') {
        buffer.id = object.id;

        buffer.obj = object;

        buffer.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
        buffer.position.itemSize = 3;
        buffer.position.numItems = object.vertices.length / buffer.position.itemSize;

        buffer.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.normals), gl.STATIC_DRAW);
        buffer.normal.itemSize = 3;
        buffer.normal.numItems = object.normals.length / buffer.normal.itemSize;

        buffer.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);
        buffer.indices.itemSize = 1;
        buffer.indices.numItems = object.indices.length / buffer.indices.itemSize;

        if(object.textureSrc !== undefined) {
            buffer.texture = gl.createTexture();
            buffer.texture.loaded = false;
            buffer.texture.image = new Image();
            buffer.texture.image.onload = function () {
                handleLoadedTexture(buffer.texture);
            }
            buffer.texture.image.src = object.textureSrc;
        } else {
            buffer.texture = gl.createTexture();
            buffer.texture.loaded = true;
            buffer.texture.image = new Image();
        }

        buffer.textureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.textureCoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.textureCoord), gl.STATIC_DRAW);
        buffer.textureCoord.itemSize = 2;
        buffer.textureCoord.numItems = object.textureCoord.length / buffer.textureCoord.itemSize;

        buffer.color = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.colors), gl.STATIC_DRAW);
        buffer.color.itemSize = 4;
        buffer.color.numItems = object.colors.length / buffer.color.itemSize;

        this.objectBuffer.push(buffer);
    } else {
        gl.uniform1i(this.shaderProgram.useLightingUniform, 1);
        gl.uniform1f(this.shaderProgram.shineUniform, 5.0);
        buffer.obj = object;

        this.objectBuffer.push(buffer);
    }
}

var eventAfterRender = new CustomEvent('after-render');
var eventLightFollow = new CustomEvent('light-follow');

WebGL.prototype.geometryToBuffer = function(o) {
    gl.bindBuffer(gl.ARRAY_BUFFER, o.position);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.color);
    gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.normal);
    gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.textureCoord);
    gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

    if(o.textureSrc !== undefined){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, o.texture);
        gl.uniform1i(this.shaderProgram.samplerUniform, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indices);
}

WebGL.prototype.lightningToBuffer = function(o) {
    if (o.obj.type === 'ambient-light') {
        gl.uniform3f(this.shaderProgram.ambientColorUniform, o.obj.color.r, o.obj.color.g, o.obj.color.b);
    } else if (o.obj.type === 'point-light') {
        document.dispatchEvent(eventLightFollow);
        gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj.position.x, o.obj.position.y, o.obj.position.z)
        gl.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj.color.r, o.obj.color.g, o.obj.color.b);
    }
}

function Geometry(){
    this.id = btoa(Math.random()).substring(0,12);
    this.matrixWorld = mat4.create();

    this.temporaryMatrixWorld = undefined;

    this.rotation = {
        _x : 0,
        _y : 0,
        _z : 0,
        updateMatrixWorld : function(deg, array) {
            mat4.rotate(this.matrixWorld, this.matrixWorld, glMatrix.toRadian(deg), array);
        }.bind(this)
    }
    Object.defineProperties(this.rotation, {
        x : {
            get : function () {
                return this._x;
            },

            set: function (value) {
                this._x = value;
                this.updateMatrixWorld(this._x, [1, 0, 0]);
            }
        },
        y : {
            get : function () {
                return this._y;
            },

            set: function (value) {
                this._y = value;
                this.updateMatrixWorld(this._y, [0, 1, 0]);
            }
        },
        z : {
            get : function () {
                return this._z;
            },

            set: function (value) {
                this._z = value;
                this.updateMatrixWorld(this._z, [0, 0, 1]);
            }
        },
    });

    this.translate = {
        to : [0, 0, 0],
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.translate.to);
        }.bind(this)
    }
    Object.defineProperties(this.translate,{
        mat : {
            get : function () {
                return this.to;
            },
            set : function (value) {
                this.to = value;
                this.updateMatrixWorld();
            },
        },
    });

    this.move = {
        direction : [0, 0, 0],
        vector : function(value) {
            this.direction[0] += value[0];
            this.direction[1] += value[1];
            this.direction[2] += value[2];
            this.updateMatrixWorld();
        },
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.move.direction);
        }.bind(this)
    }

}

Geometry.prototype.constructor = Geometry;

function Color(hex){
    if(hex.charAt(0) == '0' && hex.charAt(1) === 'x'){
        hex = hex.substr(2);
    }
    let values = hex.split('');
    this.r = parseInt(values[0].toString() + values[1].toString(), 16);
    this.g = parseInt(values[2].toString() + values[3].toString(), 16);
    this.b = parseInt(values[4].toString() + values[5].toString(), 16);
}

function AmbientLight(color, intensity = 0.2) {
    this.type = 'ambient-light';
    this.color = {};
    this.color.r = (color.r - 0)/255 * intensity;
    this.color.g = (color.g - 0)/255 * intensity;
    this.color.b = (color.b - 0)/255 * intensity;
}

function PointLight(color, position) {
    this.type = 'point-light';
    this.color = {};
    this.color.r = (color.r - 0)/255;
    this.color.g = (color.g - 0)/255;
    this.color.b = (color.b - 0)/255;
    this.position = position;
}

function multiply(a,b) {
    let c1,c2,c3,c4;
    c1 = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] + a[12]*b[3]
    c2 = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] + a[13]*b[3]
    c3 = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3]
    c4 = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3]
    return [c1,c2,c3,c4]
}

class CollisionDetector{
    constructor(box, r){
        this.box = box;
        this.r = r;

        this.THRESHOLD = 0.05;
    }

    buildCollider(){
        let point = this.box.position;
        this.BACK = this.planeFromPoint(point[2], point[3], point[6]);
        this.FRONT = this.planeFromPoint(point[1], point[4], point[5]);
        this.RIGHT = this.planeFromPoint(point[1], point[3], point[5]);
        this.LEFT = this.planeFromPoint(point[0], point[2],point[4]);
        this.BOTTOM = this.planeFromPoint(point[1], point[2], point[3]);
        this.TOP = this.planeFromPoint(point[4], point[5], point[6]);
    }

    planeFromPoint(A, B, C) {
        let n = [], temp = [], temp2 = []
        temp = vec3.subtract(temp,B,A)
        temp2= vec3.subtract(temp2,C,B)
        n = vec3.cross(n,temp,temp2)

        let D = 0;
        D = vec3.dot(n.map(x =>-x), A)
        // Equation = n_x X + n_y Y + n_z Z - D = 0
        return n.concat(D)
    }

    distancePointToPlane(planeEq, point) {
        let new_point = point;
        let num = Math.abs(
            planeEq[0]*new_point[0] + 
            planeEq[1]*new_point[1] + 
            planeEq[2]*new_point[2] + planeEq[3])
        let denum = Math.sqrt(planeEq.slice(0,3).map(x => x*x).reduce((a,b) => a+b, 0))
        return num/denum
    }

    detect(){
        let pos = this.r.position;
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.TOP, pos[i]) < this.THRESHOLD && dir[1] > 0) {dir[1] *= -1; rotater *= -1; return;}
            if(this.distancePointToPlane(this.TOP, pos[i]) < this.THRESHOLD && dir[1] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.BOTTOM, pos[i]) < this.THRESHOLD && dir[1] < 0) {dir[1] *= -1; rotater *= -1; return;}
            if(this.distancePointToPlane(this.BOTTOM, pos[i]) < this.THRESHOLD && dir[1] > 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.FRONT, pos[i]) < this.THRESHOLD && dir[2] > 0) {dir[2] *= -1; rotater *= -1; return;} 
            if(this.distancePointToPlane(this.FRONT, pos[i]) < this.THRESHOLD && dir[2] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.BACK, pos[i]) < this.THRESHOLD && dir[2] < 0) {dir[2] *= -1; rotater *= -1; return;}
            if(this.distancePointToPlane(this.BACK, pos[i]) < this.THRESHOLD && dir[2] > 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.RIGHT, pos[i]) < this.THRESHOLD && dir[0] > 0) {dir[0] *= -1; rotater *= -1; return;}
            if(this.distancePointToPlane(this.RIGHT, pos[i]) < this.THRESHOLD && dir[0] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.LEFT, pos[i]) < this.THRESHOLD && dir[0] < 0) {dir[0] *= -1; rotater *= -1; return;}
            if(this.distancePointToPlane(this.LEFT, pos[i]) < this.THRESHOLD && dir[0] < 0) {return;}
        }
    }
}

var eventRightClick = new CustomEvent('right-click');

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var THETA = 0, PHI = 0;

var mouseDown = function(e) {
    if(e.which === 1){
        drag = true;
        old_x = e.pageX, old_y = e.pageY;
        e.preventDefault();
        return false;
    } else if (e.which === 3){
        e.preventDefault();
        document.dispatchEvent(eventRightClick);
    }
};

var mouseUp = function(e){
    if(e.which ===  1){
        drag = false;
    }
};

var mouseMove = function(e) {
    if(e.which === 1){
        if (!drag) return false;
        dX = (e.pageX-old_x)*2*Math.PI/gl.viewportWidth/2,
        dY = (e.pageY-old_y)*2*Math.PI/gl.viewportHeight/2;
        THETA+= dX;
        PHI+=dY;
        old_x = e.pageX, old_y = e.pageY;
        e.preventDefault();
    }
};

document.addEventListener("mousedown", mouseDown, false);
document.addEventListener("mouseup", mouseUp, false);
document.addEventListener("mouseout", mouseUp, false);
document.addEventListener("mousemove", mouseMove, false);


WebGL.prototype.renderFirstScene = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pvMatrix[1], glMatrix.toRadian(45), gl.viewportWidth/gl.viewportHeight, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[1]);
    mat4.translate(this.mvMatrix[1], this.mvMatrix[1], [0.0, 0.0,-50.0])
    for(let i = 0; i < this.objectBuffer.length; i++) {
        this.mvPushMatrix(1);

        let o = this.objectBuffer[i];

        if(o.obj.type === 'geometry') {
            var ev = new CustomEvent(o.id);
            document.dispatchEvent(ev);

            //console.log(this.mvMatrix[1]);

            mat4.multiply(this.mvMatrix[1], this.mvMatrix[1], o.obj.matrixWorld);

            this.geometryToBuffer(o);

            let temp = [];
            for(let i = 0; i < o.obj.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[1], o.obj.vertices_[i]));
            }
            o.obj.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(1);

            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }

        //console.log(o.obj.position);

        this.mvPopMatrix(1);

    }

    document.dispatchEvent(eventAfterRender);
}

WebGL.prototype.renderSecondScene = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    // Perspective Camera
    mat4.perspective(this.pvMatrix[2], glMatrix.toRadian(45), gl.viewportWidth/gl.viewportHeight, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[2]);

    mat4.translate(this.mvMatrix[2], this.mvMatrix[2], [0.0, 0.0,-50.0])
    
    document.addEventListener('right-click', function(){
        THETA = 0;
        PHI = 0;
    });
    
    mat4.rotateY(this.mvMatrix[2], this.mvMatrix[2], THETA);
    mat4.rotateX(this.mvMatrix[2], this.mvMatrix[2], PHI);   

    for(let i = 0; i < this.objectBuffer.length; i++) {
        this.mvPushMatrix(2);

        let o = this.objectBuffer[i];
        if(o.obj.type === 'geometry') {
            mat4.multiply(this.mvMatrix[2], this.mvMatrix[2], o.obj.matrixWorld);
            this.geometryToBuffer(o);

            let temp = [];
            for(let i = 0; i < o.obj.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[2], o.obj.vertices_[i]));
            }
            o.obj.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(2);
            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }
        this.mvPopMatrix(2);
    }
    document.dispatchEvent(eventAfterRender);
}

// Frame 3
var cameraAngle = 0;

WebGL.prototype.renderThirdScene = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pvMatrix[4], glMatrix.toRadian(45), gl.viewportWidth/gl.viewportHeight, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[4]);

    let cameraMatrix = mat4.create(), viewMatrix = mat4.create();
    mat4.rotateY(cameraMatrix, cameraMatrix, cameraAngle);
    mat4.translate(cameraMatrix, cameraMatrix, [0, 0, 50]);
    
    mat4.invert(viewMatrix,cameraMatrix);
    mat4.multiply(this.pvMatrix[4], this.pvMatrix[4],  viewMatrix);

    for(let i = 0; i < this.objectBuffer.length; i++) {
        this.mvPushMatrix(4);
        let o = this.objectBuffer[i];

        if(o.obj.type === 'geometry') {
            mat4.multiply(this.mvMatrix[4], this.mvMatrix[4], o.obj.matrixWorld);
            this.geometryToBuffer(o);

            let temp = [];
            for(let i = 0; i < o.obj.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[4], o.obj.vertices_[i]));
            }
            o.obj.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(4);
            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }
        this.mvPopMatrix(4);
    }
    cameraAngle += 0.02;
}

// Frame 4
var revTranslate = [0.0, 0.0, 0.0];
var revRotate = 0;

WebGL.prototype.renderFourthScene = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pvMatrix[3], glMatrix.toRadian(45), gl.viewportWidth/gl.viewportHeight, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[3]);

    for(let i = 0; i < this.objectBuffer.length; i++) {
        this.mvPushMatrix(3);

        let o = this.objectBuffer[i];
        if(i == 1) continue;
        if(o.obj.type === 'geometry') {
            
            revTranslate[0] += (-window.dir[0])*0.1;
            revTranslate[1] += (-window.dir[1])*0.1;
            revTranslate[2] += (-window.dir[2])*0.1;
            revRotate += (-window.rotater*0.5);
            
            let tempMat = Object.assign([], o.obj.matrixWorld);
            mat4.rotate(tempMat, tempMat, glMatrix.toRadian(revRotate), [0, 0, -1]);
            mat4.translate(tempMat, tempMat, [-revTranslate[0], revTranslate[2], -revTranslate[1]])
            mat4.multiply(this.mvMatrix[3], this.mvMatrix[3], tempMat );

            this.geometryToBuffer(o);

            let temp = [];
            for(let i = 0; i < o.obj.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[3], o.obj.vertices_[i]));
            }
            o.obj.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(3);
            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }
        this.mvPopMatrix(3);
    }
}

WebGL.prototype.render = function() {
    gl.enable(gl.SCISSOR_TEST);

    var width = gl.viewportWidth;
    var height = gl.viewportHeight;
    
    this.renderFirstScene(0 * width/2, 1 * height/2, width/2, height/2);
    this.renderSecondScene(1 * width/2, 1 * height/2, width/2, height/2);
    this.renderThirdScene(1 * width/2, 0 * height/2, width/2, height/2);
    this.renderFourthScene(0 * width/2, 0 * height/2, width/2, height/2);
}

var rotater = 1;
var dir = [1, 1, 1];