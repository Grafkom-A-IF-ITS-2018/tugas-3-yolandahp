var gl;

function WebGL(id){
    var canvas = document.getElementById(id)
    gl = canvas.getContext('webgl');
    gl.viewportWidth = canvas.width; 
    gl.viewportHeight = canvas.height; 

    function initShaders(){
        var vertexShader = getShader(gl, 'shader-vs');
        var fragmentShader = getShader(gl, 'shader-fs');

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.linkProgram(this.shaderProgram);

        if(!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)){
            alert('Tidak bisa menghubungkan shader-shader');
        }

        gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
        
        this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexColor');
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

        this.shaderProgram.vertexNormalAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexNormal');
        gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);
        
        this.shaderProgram.vertexTexCoordAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexTexCoord');
        gl.enableVertexAttribArray(this.shaderProgram.vertexTexCoordAttribute);
        
        this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, 'uPMatrix')
        this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, 'uMVMatrix')
        this.shaderProgram.normalMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uNormalMatrix");
        this.shaderProgram.samplerUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.useLightingUniform = gl.getUniformLocation(this.shaderProgram, "uUseLighting");
        this.shaderProgram.ambientColorUniform = gl.getUniformLocation(this.shaderProgram, "uAmbientColor");
        this.shaderProgram.pointLightingLocUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingLoc");
        this.shaderProgram.pointLightingColorUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingColor");
        this.shaderProgram.alphaUniform = gl.getUniformLocation(this.shaderProgram, "uAlpha");
        this.shaderProgram.shineUniform = gl.getUniformLocation(this.shaderProgram, "uShine");
    }

    initShaders = initShaders.bind(this);
    initShaders();

    this.mvMatrixStack = {
        '1' : [],
        '2' : [],
        '3' : [],
        '4' : []
    }

    this.mvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create()
    }

    this.pvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create()
    }

    this.objectBuffer [];

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

function getShader(gl, id){
    var shaderScript = document.getElementById(id);
    if(!shaderScript){
        return null;
    }
    
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
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == 'x-shader/x-vertex' ){
        shader = gl.createShader(gl.VERTEX_SHADER);                   
    } else{
        return null;
    }
    
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function handleLoadedTexture(texture){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.nearest);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, gl.nearest);

    gl.bindTexture(gl.TEXTURE_2D, null);

    texture.loaded = true;
}

WebGL.prototype.mvPushMatrix = function(i){
    var duplicate = mat4.create();
    var mvMat = this.mvMatrix[i];
    var mvMatStack = this.mvMatrixStack[i];

    mat4.copy(duplicate, mvMat);
    mvMatStack.push(duplicate);
}

WebGL.prototype.mvPopMatrix = function(i){
    if(mvMatrixStack[i].length == 0){
        throw 'Tumpukan matrix kosong';
    }
    this.mvMatrix[i] = this.mvMatrixStack[i].pop();
}

WebGL.prototype.setMatrixUniform() = function(i){
    var nMatrix = mat3.create();

    var mvMatrix = this.mvMatrix[id];
    var pMatrix = this.pvMatrix[id];

    mat3.normalFromMat4(nMatrix, mvMatrix);

    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.normalMatrixUniform, false, nMatrix);
}

WebGL.prototype.addbuffer = function(object){
    var buffer = {};
    if(object.type == 'geometry'){
        buffer.id = object.id;
        buffer.obj = object;

        buffer.vertexPosition = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
        buffer.vertexPosition.itemSize = 3;
        buffer.vertexPosition.numItems = object.vertices.length/buffer.vertexPosition.itemSize;

        buffer.vertexNormal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexNormal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.normals), gl.STATIC_DRAW);
        buffer.vertexNormal.itemSize = 3;
        buffer.vertexNormal.numItems = object.normals.length/buffer.vertexNormal.itemSize;

        buffer.vertexIndex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexIndex);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);
        buffer.vertexIndex.itemSize = 3;
        buffer.vertexIndex.numItems = object.indices.length/buffer.vertexIndex.itemSize;

        if(object.textureSrc !== undefined) {
            buffer.texture = GL.createTexture();
            buffer.texture.loaded = false;
            buffer.texture.image = new Image();
            buffer.texture.image.onload = function () {
                handleLoadedTexture(buffer.texture);
            }
            buffer.texture.image.src = object.textureSrc;
        } else{
            buffer.texture = GL.createTexture();
            buffer.texture.loaded = true;
            buffer.texture.image = new Image();
        }

        buffer.vertexTextureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexTextureCoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.textureCoord), gl.STATIC_DRAW);
        buffer.vertexTextureCoord.itemSize = 2;
        buffer.vertexTextureCoord.numItems = object.textureCoord.length/buffer.vertexTextureCoord.itemSize;

        buffer.vertexColor = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexColor);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.colors), gl.STATIC_DRAW);
        buffer.vertexColor.itemSize = 4;
        buffer.vertexColor.numItems = object.colors.length/buffer.vertexColor.itemSize;

        this.objectBuffer.push(buffer);
    } else{
        gl.uniform1i(this.shaderProgram.useLightingUniform, 1);
        gl.uniform1f(this.shaderProgram.shineUniform, 5.0);
        buffer.obj = object;

        this.objectBuffer.push(buffer);
    }
}

var eventAfterRender = new CustomEvent('after-render');
var eventLightFollow = new CustomEvent('light-follow');

WebGL.prototype.geometryToBuffer = function(o){
    gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexPosition);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.vertexPosition.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexColor);
    gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.vertexColor.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexNormal);
    gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.vertexNormal.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexTextureCoord);
    gl.vertexAttribPointer(this.shaderProgram.vertexTexCoordAttribute, o.vertexTextureCoord.itemSize, gl.FLOAT, false, 0, 0);

    if(o.textureSrc !== undefined){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, o.vertexTexture);
        gl.uniform1i(this.shaderProgram.samplerUniform, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.vertexIndex);
}

