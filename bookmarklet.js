javascript:(function zzdbg_load(src) { if((window.zzdbg||{}).script) zzdbg.script.remove(); var s = document.createElement("script"); s.className = "zzdbg"; s.textContent = src; document.body.appendChild(s); zzdbg.loader = zzdbg_load; zzdbg.script = s; })("(function zzdbg_main(){\n\nvar w = window;\nvar d = w.document;\nvar zzdbg = {};\nvar ui = d.createElement(\"div\");\nvar hpos = 0;\nvar oldconsole = {};\nvar reqHandlers = {};\nvar resHandlers = [null];\n\nzzdbg.loader = null;\nzzdbg.script = null;\nzzdbg.history = [];\nzzdbg.editors = [];\nzzdbg.editor = null;\nzzdbg.filename = null;\n\nif(w.zzdbg) {\nzzdbg.loader = w.zzdbg.loader;\nzzdbg.script = w.zzdbg.script;\nzzdbg.script.textContent = \"(\"+zzdbg_main.toString()+\")();\";\nw.zzdbg.script = null;\nzzdbg.history = w.zzdbg.history;\nzzdbg.editors = w.zzdbg.editors;\nzzdbg.editor = w.zzdbg.editor;\nw.zzdbg.editor = null;\nzzdbg.filename = w.zzdbg.filename;\nw.zzdbg.close();\n}\nw.zzdbg = zzdbg;\n\nzzdbg.close = function() {\nexchange(oldconsole, console);\nif(zzdbg.script) zzdbg.script.remove();\nui.remove();\nw.removeEventListener(\"message\", messageListener, true);\ndelete w.zzdbg;\n};\nzzdbg.ui = ui;\n\nui.className = \"zzdbgui\";\nui.innerHTML = '<style>'+\n'.zzdbg, * { pointer-events:auto !important; }'+\n'.zzdbgui, .zzdbgui *, .zzeditor { font:3vw monospace !important; margin:0 !important; padding:0 !important; box-sizing:border-box !important; border-radius:0; background-color:white; color:black; }'+\n'.zzdbgui { position:fixed; left:0; bottom:0; width:100%; height:40%; z-index:100000000000; }'+\n'.zzdbgui textarea, .zzdbgui input, .zzeditor { border:0.3vw solid black !important; padding:0 1vw !important; outline:none; resize:none; }'+\n'.zzoutput { position:absolute; left:0; top:0; width:100%; height:calc(100% - 6vw); overflow-y:auto; white-space:pre-wrap; }'+\n'.zzbar { position:absolute; left:0; bottom:0; width:100%; height:6vw; }'+\n'.zzbar * { position:absolute; top:0; height:100%; }'+\n'.zzinput { left:0; width:calc(100% - 20vw) !important; }'+\n'.zzdnbtn, .zzupbtn { width:10vw; font-size:1em; text-align:center; }'+\n'.zzdnbtn { right:10vw; }'+\n'.zzupbtn { right:0vw; }'+\n'.zzsuggest { position:fixed; bottom:5vw; right:25vw; border:0.3vw solid black; overflow-x:hidden; overflow-y:auto; }'+\n'.zzsuggest[hidden] { display:none !important; }'+\n'.zzsuggest > * { padding:0.5vw 2vw !important; }'+\n'.zzeditor { width:100%; height:60%; }'+\n'</style>'+\n'<textarea class=\"zzoutput\" readonly=\"true\"></textarea>'+\n'<div class=\"zzbar\">'+\n'<textarea class=\"zzinput\"></textarea>'+\n'<input class=\"zzdnbtn\" type=\"button\" value=\"⬇\">'+\n'<input class=\"zzupbtn\" type=\"button\" value=\"⬆\">'+\n'</div>'+\n'<div class=\"zzsuggest\" hidden><\\div>';\n\nd.body.appendChild(ui);\nvar output = ui.querySelector(\".zzoutput\");\nvar input = ui.querySelector(\".zzinput\");\nvar upbtn = ui.querySelector(\".zzupbtn\");\nvar dnbtn = ui.querySelector(\".zzdnbtn\");\nvar suggest = ui.querySelector(\".zzsuggest\");\nzzdbg.output = output;\nzzdbg.input = input;\nzzdbg.upbtn = upbtn;\nzzdbg.dnbtn = dnbtn;\nzzdbg.suggest = suggest;\n\n\nzzdbg.lastError = undefined;\nzzdbg.do = function(cmd) {\nvar err, res;\nvar quiet = false;\nwriteToOutput([\"> \"+cmd], true);\n\ntry {\nif(\".h\" == cmd) {\nzzdbg.info(zzdbg.doc);\nquiet = true;\n} else if(\".q\" == cmd) return zzdbg.close();\nelse if(/^\\.o\\b/.test(cmd)) res = zzdbg.open(zzdbg.evalLocal(\"(\"+cmd.replace(/^\\.o\\s*/, \"\")+\")\"));\nelse if(/^\\.d\\b/.test(cmd)) res = docLookup(cmd.replace(/^\\.d\\s*/, \"\"));\nelse if(/^\\.p\\b/.test(cmd)) res = zzdbg.properties(zzdbg.evalLocal(\"(\"+cmd.replace(/^\\.p\\s*/, \"\")+\")\"));\nelse if(\".e\" == cmd) {\nselectElement();\nquiet = true;\n} else if(\".a\" == cmd) {\nzzdbg.applyChanges();\nquiet = true;\n} else if(/^\\.s\\b/.test(cmd)) {\nif(!zzdbg.editor) throw new Error(\"not in edit mode\");\nzzdbg.filename = cmd.replace(/^\\.s\\s*|\\s*$/g, \"\") || zzdbg.filename;\nzzdbg.dl({ filename: zzdbg.filename || \"untitled.txt\", url:\"data:text/plain,\"+encodeURI(zzdbg.editor.value) });\n} else res = zzdbg.evalLocal(cmd.replace(/^javascript:/, \"\"));\n} catch(e) { err = e; }\n\nif(!quiet) writeToOutput([err||res], false);\nif(\".c\" == cmd) output.value = \"\";\nzzdbg.history.push({ cmd:cmd, res:res, err:err });\nw._ = res;\nzzdbg.lastError = err;\n};\n\ninput.onkeydown = function(event) {\nvar cmd = input.value;\nhpos = 0;\nif(\"Enter\" != event.key) return;\nevent.preventDefault();\nif(\"\" == cmd) return;\ninput.value = \"\";\nzzdbg.do(cmd);\nsuggest.hidden = true;\n};\ninput.onkeyup = function(event){\nvar cmd = input.value;\nvar pos = input.selectionEnd;\nvar term = cmd.slice(0, pos).match(/([\\w$]+\\.)*[\\w$]*$/);\ntry {\nvar base = term[0].replace(/\\.?[\\w$]*$/, \"\") || \"window\";\nvar part = term[0].replace(/^([\\w$]+\\.)*/, \"\");\nvar compare = new Intl.Collator(\"en\").compare;\nvar props = term[0].length ? zzdbg.properties(zzdbg.evalLocal(\"(\"+base+\")\")) : [];\nprops = Array.prototype.concat.apply([], props).filter(function(prop){ return prop.startsWith(part) && prop != part; }).sort(compare);\n\nsuggest.innerHTML = \"\";\nfor(var i = 0; i < props.length; i++) {\nvar item = d.createElement(\"div\");\nitem.textContent = props[i];\nsuggest.appendChild(item);\nitem.onclick = function() {\ninput.value = input.value.slice(0, pos)+this.textContent.slice(part.length)+input.value.slice(pos);\nsuggest.hidden = true;\ninput.focus();\ninput.selectionStart = input.selectionEnd = pos+(this.textContent.length-part.length);\n};\n}\nsuggest.hidden = !props.length;\nsuggest.style.width = suggest.scrollWidth+\"px\";\nsuggest.style.height = Math.min(suggest.scrollHeight, w.innerHeight*.75)+\"px\";\n} catch(e) { suggest.hidden = true; }\n};\n\n\ndnbtn.onclick = upbtn.onclick = function(event) {\ninput.focus();\nvar dir = 0;\nif(dnbtn == this) dir = -1;\nif(upbtn == this) dir = +1;\nif(0 == dir) return;\nhpos += dir;\nhpos = Math.min(hpos, zzdbg.history.length);\nif(hpos < 0) hpos = 0;\ninput.value = hpos ? zzdbg.history.slice(-hpos)[0].cmd : \"\";\ninput.selectionStart = input.selectionEnd = input.value.length;\n};\n\n\nzzdbg.stringify = null;\nzzdbg.stringifyDepth = 3;\nzzdbg.stringifyFull = function(x, depth, inlineStrings) {\nif(undefined === depth || undefined === inlineStrings) throw new Error(\"stringify args\");\n\nif(zzdbg.stringify) {\nx = zzdbg.stringify(x, depth, inlineStrings);\nif(isa(x, String)) return x;\n}\n\nif(depth >= zzdbg.stringifyDepth) return \"…\";\nif(depth >= 1 && \"function\" == typeof x) return \"[function …]\";\n\nif(isa(x, Text)) {\nx = x.textContent.replace(/^\\s+|\\s+$/g, \"\");\nif(!x) return '\" \"';\n}\n\nif(isa(x, String)) {\nreturn inlineStrings && 0 == depth ? x : JSON.stringify(x);\n}\n\nif(isa(x, NodeList) || isa(x, NamedNodeMap) || isa(x, StyleSheetList) || isa(x, HTMLCollection) || isa(x, HTMLAllCollection)) x = toArray(x);\n\nif(isa(x, Array)) {\nif(depth >= zzdbg.stringifyDepth-1) return \"[ (\"+x.length+\" items) ]\";\nreturn \"[ \"+x.map(function(y, i) { return i+\": \"+zzdbg.stringifyFull(y, depth+1, inlineStrings); }).join(\", \")+\" ]\";\n}\n\nif(isa2(x, Window)) {\ntry { return \"[Window \"+zzdbg.stringifyFull(x.zzdbg_initialLocation||x.location.href, depth+1, inlineStrings)+\"]\"; }\ncatch(e) { if(!isSecurityError(e)) throw e; return \"[Cross-origin window for \"+zzdbg.stringifyFull(zzdbg.frameElement(x), depth+1, false)+\"]\"; }\n}\n\ntry {\nif(isa(x, CSSStyleSheet) || isa(x, CSSRuleList)) return \"[\"+x.constructor.name+\" with \"+(x.cssRules||x).length+\" rules]\";\nif(isa(x, CSSRule)) return x.cssText;\nif(isa(x, CSSStyleDeclaration)) return \"{ \"+(x.cssText||toArray(x).filter(function(attr) { return x[attr]; }).map(function(attr) { return attr+\": \"+x[attr]; }).join(\"; \"))+\" }\";\n} catch(e) {\nif(!isSecurityError(e)) throw e;\nif(x.href) return \"[\"+x.constructor.name+' \"'+url_summary(x.href)+'\"]';\nreturn \"[cross-origin \"+x.constructor.name+\"]\"\n}\n\nfunction url_summary(url) {\nreturn 0 == depth ? url : \"…\"+(urlBasename(url)||\"\");\n}\nif(isa(x, HTMLElement)) {\nvar attrs = toArray(x.attributes).filter(function(attr) { return 0 == depth || /^(id|class|href|src)$/i.test(attr.name); }).map(function(attr) { return zzdbg.stringifyFull(attr, depth, false); });\nif(attrs.length < x.attributes.length) attrs.push(\"…\");\nreturn \"<\"+[x.tagName.toLowerCase()].concat(attrs).join(\" \")+\">\"+(0==depth ? \" \"+zzdbg.stringifyFull(zzdbg.cssRules(x), depth, false) : \"\");\n}\nif(isa(x, Attr)) {\nif(/^(href|src|srcset|background|poster)$/i.test(x.name)) return x.name+'=\"'+url_summary(x.value)+'\"';\nreturn x.name+'=\"'+x.value+'\"';\n}\n\nvar str;\nif(null === x || undefined === x) str = String(x);\ntry { if(!str && x.__proto__ && \"function\" == typeof x.__proto__.toString) str = String(x.__proto__.toString.call(x)); }\ncatch(e) { if(isSecurityError(e)) str = \"[cross-origin object]\"; }\nif(!str) str = Object.prototype.toString.call(x);\n\nif(str && \"[object Object]\" != str) return str;\nreturn \"{ \"+Object.keys(x).map(function(key) { return key+\": \"+zzdbg.stringifyFull(x[key], depth+1, inlineStrings); }).join(\", \")+\" }\";\n};\n\n\nfunction findprop(obj, prop, depth) {\nif(!depth) return null;\nif(!obj) return null;\nvar descriptors = Object.getOwnPropertyDescriptors(obj);\n\nfor(var name in descriptors) {\nif(obj === w && descriptors[name].enumerable) continue;\nvar val = descriptors[name].value;\nif(\"function\" != typeof val) continue;\nif(prop.constructor === val && Function != val) return [name];\nif(val === prop) return [name];\nvar x = findprop(val.prototype, prop, depth-1) || findprop(val, prop, depth-1);\nif(x) return [name].concat(x);\n}\nreturn null;\n}\nfunction docLookup(str) {\nvar url = null;\ntry {\nvar path = null;\nif(\"\" === str) return zzdbg.info(\"Usage: .d (expression or search terms)\");\nif(\"null\" == str || \"undefined\" == str) path = [str];\nelse {\nvar x = zzdbg.evalLocal(\"(\"+str+\")\");\nif(null === x || undefined === x) throw new Error();\npath = findprop(w, x, 2);\n}\nif(!path || !path[0]) throw new Error();\n\nif(\"CSS2Properties\" == path[0]) path[0] = \"CSSStyleDeclaration\";\n\nif(/^encode|^Object$|^Array$|^Boolean$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$|Function$/.test(path[0])) url = \"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/\"+path.join(\"/\");\nelse if(/^CSS|^DOM|^File|^HTML|^Node|^NamedNode|^RTC|^XML|^Attr$|^ChildNode$|^Document$|^IDBFactory$|^URL$|^Window$|Event|Style|Element$|List$/.test(path[0])) url = \"https://developer.mozilla.org/en-US/docs/Web/API/\"+path.join(\"/\");\nelse url = \"https://developer.mozilla.org/en-US/search?q=\"+path.join(\".\");\n\n} catch(e) {\nurl = \"https://developer.mozilla.org/en-US/search?q=\"+encodeURIComponent(str);\n}\n\nreturn zzdbg.openWindow(url);\n}\n\nzzdbg.properties = function(obj) {\nvar descriptors = Object.getOwnPropertyDescriptors(obj);\nvar results = [ Object.keys(descriptors) ];\nvar proto = null;\ntry { proto = obj.__proto__; }\ncatch(e) {}\nif(proto) results =  results.concat(zzdbg.properties(proto));\nreturn results;\n};\n\n\nzzdbg.cancelSelect = null;\nzzdbg.selectElement = function(roots, callback) {\nroots = isa(roots, Array) ? roots : roots ? [roots] : [w].concat(toArray(w));\nfor(var i = 0; i < roots.length; i++) try { roots[i].addEventListener(\"click\", listener, true); } catch(e) { zzdbg.info(\"Unable to install handler\", roots[i]); }\nif(zzdbg.cancelSelect) zzdbg.cancelSelect();\nzzdbg.cancelSelect = function() {\nfor(var i = 0; i < roots.length; i++) try { roots[i].removeEventListener(\"click\", listener, true); } catch(e) {}\nzzdbg.cancelSelect = null;\n};\nfunction listener(event) {\nevent.preventDefault();\nevent.stopPropagation();\nzzdbg.cancelSelect();\nif(callback) callback(event.target);\n}\n};\nzzdbg.lastSelectedElement = null;\nfunction selectElement() {\nzzdbg.selectElement(null, function(elem) {\nzzdbg.selectElementAction(elem);\nvar h = zzdbg.history.slice(-1)[0];\nif(h && \".e\" == h.cmd) { h.res = w._ = elem; }\nzzdbg.lastSelectedElement = elem;\n});\nzzdbg.info(\"(Waiting for click…)\");\n}\n\n\nzzdbg.log = zzdbg.info = function zzdbg_log(...args) {\nwriteToOutput(args, true);\n};\nzzdbg.warn = specialLog(\"Warning:\");\nzzdbg.error = specialLog(\"Error:\");\nfunction specialLog(pfx) {\nreturn function zzdbg_log(...args) { writeToOutput([pfx].concat(args), true); };\n};\noldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;\nexchange(oldconsole, console);\nfunction writeToOutput(array, inlineStrings) {\nif(output.value) output.value +=\"\\n\";\ntry { output.value += array.map(function(arg) { return zzdbg.stringifyFull(arg, 0, inlineStrings); }).join(\" \"); }\ncatch(e) { output.value += e+\" (zzdbg stringify)\"; }\noutput.scrollTop = output.scrollHeight;\n}\nzzdbg.selectElementAction = zzdbg.log;\n\n\nzzdbg.cssRules = function(obj) {\nvar elems = isa(obj, String) ? document.querySelectorAll(obj) : obj.length >= 0 ? obj : [obj];\nvar results = [];\nvar sheets = d.styleSheets;\nfor(var i = 0; i < sheets.length; i++) {\nvar rules;\ntry { rules = sheets[i].cssRules; }\ncatch(e) { results.push(sheets[i]); continue; }\nfor(var j = 0; j < rules.length; j++) {\nfor(var k = 0; k < elems.length; k++) {\ntry { if(elems[k].matches(rules[j].selectorText)) { results.push(rules[j]); break; } }\ncatch(e) { if(!isa(e, SyntaxError)) throw e+k; }\n}\n}\n}\nreturn results;\n};\n\n\nzzdbg.open = function(obj) {\nvar win = zzdbg.viewAsSource(obj);\nif(win) return win;\nobj = zzdbg.frameElement(obj) || obj;\nvar url = parseURL(obj) || (obj.location||{}).href || obj.href || obj.src || ((obj.attributes||{}).background||{}).value;\nif(!url) return null;\nurl = String(url);\nif(/^javascript:/.test(url)) return zzdbg.viewAsSource(url);\nreturn zzdbg.openWindow(url);\n};\nzzdbg.viewAsSource = function(obj, name) {\nvar target = obj, url, str;\nif(obj == zzdbg.loader) {\ntarget = \"loader.js\";\nstr = obj.toString();\nname = name || target;\n} else if(isa(obj, HTMLScriptElement)) {\nif(obj == zzdbg.script) name = name || \"zzdbg.js\";\nif(obj.src) { url = obj.src; name = name || urlBasename(obj.src) || \"untitled.js\"; }\nelse { str = obj.textContent; name = name || \"inline-script.js\"; }\n} else if(isa(obj, HTMLStyleElement)) {\nstr = obj.textContent;\n} else if(isa(obj, CSSStyleSheet)) {\nif(obj.href) url = obj.href;\nelse str = obj.ownerNode.textContent;\n} else if(isa(obj, HTMLLinkElement)) {\nurl = obj.href;\n} else if(isa(obj, String)) {\nvar parsed = parseURL(obj);\nif(!parsed) str = obj;\nelse if(\"javascript:\" == parsed.protocol) {\nstr = obj;\nname = name || \"bookmarklet.js\";\n} else if(/\\.(js|css|html)$/i.test(parsed.pathname)) url = obj;\ntarget = null;\n}\nreturn openEditor(target, url, str, name);\n};\nfunction findEditor(obj) {\nif(!obj) return;\nvar ed = zzdbg.editors;\nfor(var i = 0; i < ed.length; i++) {\nvar closedOrDead = true;\ntry { closedOrDead = ed[i].window.closed; } catch(e) {}\nif(closedOrDead) { ed.splice(i, 1); i--; continue; }\nif(ed[i].window === obj) return ed[i].target;\nif(ed[i].target === obj) return ed[i].window;\n}\n}\nfunction openEditor(target, url, str, name) {\nvar win = findEditor(target);\nif(win) return win.focus(), win;\nif(!url && !isa(str, String)) return null;\nvar title = \"zzdbg source view for \"+(name||\"untitled\")+\" (\"+d.title+\")\";\nvar jsurl = 'javascript:'+JSON.stringify(title)+'; \"...\"';\nwin = zzdbg.openWindow(url || jsurl, \"editor\");\nif(!win) throw new Error(\"couldn't create window\");\ntry { setupWin(); win.onload = setupWin; }\ncatch(e) { zzdbg.info(\"(To edit, run zzdbg again in the new window)\"); }\nfunction setupWin() {\nif(!url) {\nwin.document.title = name || \"\";\nwin.document.body.innerHTML = \"<pre></pre>\";\nwin.document.querySelector(\"pre\").textContent = str.replace(/^\\s+|\\s+$/g, \"\");\n}\nwin.zzdbg_filename = name;\nwin.location = zzdbg.bookmarklet();\n}\nzzdbg.editors.push({ window:win, target:target });\nreturn win;\n}\nzzdbg.applyChanges = function() {\nif(!zzdbg.editor) throw new Error(\"not in edit mode\");\nvar src = zzdbg.editor.value;\nsendWindowRequest(w.opener, \"apply\", { src:src }, function(res) { zzdbg.info(\"Apply changes:\", res || \"success\"); });\n};\nreqHandlers.apply = function(win, payload, sendRes) {\nvar target = findEditor(win);\nif(undefined === target) return sendRes(\"unknown target\");\nvar src = payload.src;\nif(!isa(src, String)) return sendRes(\"not a string\");\ntry {\nif(!target) {\nreturn sendRes(\"target does not support editing\");\n} else if(\"loader.js\" == target) {\nzzdbg.loader = zzdbg.evalLocal(\"(\"+src+\")\");\n} else if(isa(target, HTMLScriptElement)) {\nif(target.src) target[\"data-zzdbg-src\"] = target.src;\ntarget.removeAttribute(\"src\");\ntarget.textContent = '\"nop\"';\ntarget.textContent = src;\nif(d.contains(target)) zzdbg.evalLocal(src);\n} else {\nzzdbg.log(\"apply to unsupported target\", target);\nreturn sendRes(\"unsupported target\");\n}\nsendRes(null);\n} catch(e) { sendRes(String(e)); }\n};\nzzdbg.openWindow = function(url, type) {\nif(isa(url, URL)) url = String(url);\nif(!isa(url, String)) throw new TypeError(\"expected string/URL\");\nvar rnd = Math.random().toString(36).slice(2);\nvar win = w.open(url, \"zzdbg-\"+(type||\"window\")+\"-\"+rnd);\ntry { if(win) win.zzdbg_initialLocation = url; }\ncatch(e) {}\nreturn win;\n};\nzzdbg.bookmarklet = function() {\nreturn 'javascript:('+zzdbg.loader.toString()+')('+JSON.stringify(\"(\"+zzdbg_main.toString()+\")();\")+');/*END*/';\n};\n\nzzdbg.wgetcmd = function(dls) {\nif(!isa(dls, Array)) dls = toArray(arguments);\nreturn dls.map(function(dl){ return \"wget --adjust-extension \" + (isa(dl, String) ? safe_shell_arg(dl) : safe_shell_arg(dl.url)+\" -O '\"+safe_filename(dl.filename)+\"'\"); }).join(\"; \");\n};\nfunction safe_shell_arg(shell_arg) {\nreturn \"'\"+shell_arg.replace(/\\'/g, \"\\\\'\")+\"'\";\n}\nfunction safe_filename(filename) {\nreturn filename.replace(/[^a-zA-Z0-9._ \\[\\]\\{\\}-]/g, \"_\");\n}\nzzdbg.dl = function(dls) {\nif(!isa(dls, Array)) dls = toArray(arguments);\nvar a = d.createElement(\"a\");\nui.appendChild(a);\n/*a.target = \"_blank\";*/\nfor(var i = 0; i < dls.length; i++) {\na.download = (isa(dls[i], String) ? \"\" : dls[i].filename);\na.href = (isa(dls[i], String) ? dls[i] : dls[i].url);\na.click();\n}\na.remove();\n};\n\nzzdbg.frameElement = function(win) {\nif(!isa(win, Window)) return null;\ntry { return win.frameElement; }\ncatch(e) { if(!isSecurityError(e)) throw e; }\nvar frames = document.querySelectorAll(\"frame, iframe\");\nfor(var i = 0; i < frames.length; i++) if(frames[i].contentWindow == win) return frames[i];\nreturn null;\n};\n\nzzdbg.traceEvent = function(target, type, eclass) {\nvar e = new (eclass||MouseEvent)(type||\"click\", { view:w, bubbles:true, cancelable:true });\nObject.defineProperty(e, \"target\", { get:function trace() { zzdbg.log(new Error().stack); return target; } });\ntarget.dispatchEvent(e);\n};\n\n\nfunction has(a, b) {\nreturn Object.prototype.hasOwnProperty.call(a, b);\n}\nfunction exchange(a, b) {\nfor(var p in a) if(has(a, p)) { var swap = a[p]; a[p] = b[p]; b[p] = swap; }\n}\nfunction toArray(x) {\nreturn Array.prototype.slice.call(x);\n}\nfunction isa(x, y) {\nif(Array == y) return Array.isArray(x);\nif(String == y && \"string\" == typeof x) return true;\nreturn x instanceof y;\n}\nfunction isa2(x, y) {\nif(isa(x, y)) return true;\ntry { return x.constructor.name == y.name; }\ncatch(e) { return false; }\n}\nfunction escapeHTML(str) {\nvar x = d.createElement(\"div\");\nx.textContent = str;\nreturn x.innerHTML;\n}\nfunction parseURL(str) {\nif(!isa(str, String)) return null;\ntry { return new URL(str, document.baseURI); }\ncatch(e) { return null; }\n}\nfunction urlBasename(str) {\nvar url = parseURL(str) || {};\nvar x = /([\\w%._-]*\\/?)$/.exec(url.pathname);\nreturn x && x[1];\n}\nfunction isSecurityError(e) {\nreturn \"SecurityError\" == e.name;\n}\n\nzzdbg.log(\"zzdbg - type .h for help\");\n\nfunction eval2(str) {\nvar n = zzdbg.evalItems.length;\nvar x = zzdbg.evalItems[n] = { err: new SyntaxError(\"eval2\") };\nvar s = d.createElement(\"script\");\nstr = str.replace(/(;|\\s|\\/\\/[^\"']*|\\/\\*[^\"']*)*$/, \"\");\nvar expr = /^\\s*\\{/.test(str) ? '{{{{{ '+str+' }}}}}' : 'zzdbg.evalItems['+n+'].res = ((((( '+str+' )))))';\ns.textContent =\n'try { '+expr+'; delete zzdbg.evalItems['+n+'].err; }'+\n'catch(e) { zzdbg.evalItems['+n+'].err = e; }';\nui.appendChild(s); s.remove();\ndelete zzdbg.evalItems[n];\nif(has(x, \"err\")) throw x.err;\nreturn x.res;\n}\nzzdbg.evalItems = [];\nzzdbg.evalLocal = eval;\ntry { zzdbg.evalLocal('\"test\"'); }\ncatch(e) {\nzzdbg.evalLocal = eval2; zzdbg.warn(\"Warning: zzdbg is running without eval(). Please wrap statements in braces: { var x; }. Expressions can be run as normal: func(). (\"+e+\")\");\n}\nzzdbg.eval = function(cmd, cb) {\nvar err = null, res = null;\ntry { res = zzdbg.evalLocal(cmd); }\ncatch(e) { err = e; }\nsetTimeout(function() { cb(err, res); }, 0);\n};\n\n\nfunction enterEditMode() {\nzzdbg.info(\"Editor mode: use .a to apply changes to main document\");\nzzdbg.eval = function(src, cb) {\nsendWindowRequest(w.opener, \"eval\", cmd, function(res) {});\n};\nif(!zzdbg.editor) {\nzzdbg.filename = w.zzdbg_filename || urlBasename(w.location.href) || \"untitled\";\nzzdbg.editor = d.createElement(\"textarea\");\nzzdbg.editor.className = \"zzeditor\";\nd.title = \"zzdbg source view for \"+zzdbg.filename;\nvar pre = d.querySelector(\"pre\") || d.body.childNodes[0];\nzzdbg.editor.value = pre.textContent;\npre.replaceWith(zzdbg.editor);\n}\n}\nreqHandlers.eval = function(win, payload, sendRes) {};\nif(/^zzdbg-editor/.test(w.name)) enterEditMode();\n\n\nfunction sendWindowRequest(window, type, payload, cb) {\nvar id = resHandlers.length;\nresHandlers[id] = cb;\nwindow.postMessage({ zzdbg_msg:{ dir:\"req\", type:type, payload:payload, id:id } }, \"*\");\n}\nfunction messageListener(ev) {\nvar win = ev.source;\nvar msg = ev.data.zzdbg_msg;\nvar dir = msg.dir;\nvar type = msg.type;\nvar payload = msg.payload;\nvar id = msg.id;\nif(\"req\" == dir && has(reqHandlers, type)) reqHandlers[type](win, payload, sendRes);\nif(\"res\" == dir && id < resHandlers.length && \"function\" == typeof resHandlers[id]) { resHandlers[id](payload); delete resHandlers[id]; }\nfunction sendRes(payload) {\nwin.postMessage({ zzdbg_msg:{ dir:\"res\", type:type, payload:payload, id:id } }, ev.origin);\n}\n}\nw.addEventListener(\"message\", messageListener, true);\n\n\nzzdbg.doc = \"Commands:\"+\n\"\\n\\t.h - help\"+\n\"\\n\\t.q - quit\"+\n\"\\n\\t.c - clear output\"+\n\"\\n\\t.o (expr) - open/view source\"+\n\"\\n\\t.d (expr) - MDN doc\"+\n\"\\n\\t.p (expr) - list properties\"+\n\"\\n\\t.e - select element\"+\n\"\\n\\t.a - apply changes to main document (editor mode)\"+\n\"\\n\\t.s (filename) - save file (editor mode)\"+\n\"\";\ninput.focus();\n})();");/*END*/